import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string | null;
  type: string;
  mediaUrl: string | null;
  duration: number | null;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  readers: string[];
  system: boolean;
  chatRoomId: string;
}

interface WebSocketState {
  // Connection state
  ws: WebSocket | null;
  socketIO: Socket | null;
  isConnected: boolean;
  userId: string | null;
  reconnectAttempts: number;
  connectionType: "websocket" | "socketio" | null;

  // Event handlers
  eventHandlers: Map<string, Set<(payload: any) => void>>;

  // Actions
  connect: (userId: string) => void;
  disconnect: () => void;
  send: (type: string, payload: any) => void;
  on: (type: string, handler: (payload: any) => void) => void;
  off: (type: string, handler: (payload: any) => void) => void;
  reconnect: () => void;

  // Internal actions
  setConnected: (connected: boolean) => void;
  setWebSocket: (ws: WebSocket | null) => void;
  setSocketIO: (socket: Socket | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Determine connection type based on environment
// Determine connection config based on environment
const getSocketConfig = () => {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return {
      type: "websocket" as const,
      // Default to localhost:8080 for custom WS server in dev
      url: process.env.NEXT_PUBLIC_WS_SERVER_URL || "ws://localhost:8080",
    };
  }

  return {
    type: "socketio" as const,
    // Use the production backend URL
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "",
  };
};

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      ws: null,
      socketIO: null,
      isConnected: false,
      userId: null,
      reconnectAttempts: 0,
      connectionType: null,
      eventHandlers: new Map(),

      connect: (userId: string) => {
        const { ws, socketIO, isConnected } = get();

        // Don't reconnect if already connected
        if (isConnected) {
          console.log("Already connected");
          return;
        }

        // Close existing connections
        if (ws) ws.close();
        if (socketIO) socketIO.disconnect();

        try {
          const config = getSocketConfig();
          const wsUrl = config.url;

          console.log("🔌 Connecting to:", wsUrl);
          console.log("📡 Connection type:", config.type);

          if (config.type === "socketio") {
            // Use Socket.IO for production (Express backend)
            connectWithSocketIO(userId, wsUrl, set, get);
          } else {
            // Use WebSocket for development (local WS server)
            connectWithWebSocket(userId, wsUrl, set, get);
          }
        } catch (error) {
          console.error("Error creating connection:", error);
        }
      },

      disconnect: () => {
        const { ws, socketIO } = get();
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        if (ws) {
          ws.close();
          set({ ws: null });
        }
        if (socketIO) {
          socketIO.disconnect();
          set({ socketIO: null });
        }
        set({ isConnected: false, userId: null, connectionType: null });
      },

      send: (type: string, payload: any) => {
        const { ws, socketIO, isConnected, connectionType } = get();

        if (!isConnected) {
          console.warn("⚠️ Not connected. Cannot send:", type);
          return;
        }

        if (connectionType === "socketio" && socketIO?.connected) {
          // Socket.IO uses emit
          socketIO.emit(type, payload);
          console.log("📤 Sent (Socket.IO):", type);
        } else if (
          connectionType === "websocket" &&
          ws?.readyState === WebSocket.OPEN
        ) {
          // WebSocket uses send
          const message = JSON.stringify({ type, payload });
          ws.send(message);
          console.log("📤 Sent (WebSocket):", type);
        } else {
          console.warn("⚠️ Connection not ready. Cannot send:", type);
        }
      },

      on: (type: string, handler: (payload: any) => void) => {
        const { eventHandlers } = get();
        if (!eventHandlers.has(type)) {
          eventHandlers.set(type, new Set());
        }

        eventHandlers.get(type)?.add(handler);
        console.log(`👂 Registered handler for: ${type}`);

        return () => {
          const handlers = eventHandlers.get(type);
          if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
              eventHandlers.delete(type);
            }
          }
        };
      },

      off: (type: string, handler: (payload: any) => void) => {
        const { eventHandlers } = get();
        const handlers = eventHandlers.get(type);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            eventHandlers.delete(type);
          }
          console.log(`🔇 Unregistered handler for: ${type}`);
        }
      },

      reconnect: () => {
        const { userId, disconnect, connect } = get();
        console.log("🔄 Manual reconnect triggered");
        disconnect();
        if (userId) {
          set({ reconnectAttempts: 0 });
          connect(userId);
        }
      },

      setConnected: (connected: boolean) => set({ isConnected: connected }),
      setWebSocket: (ws: WebSocket | null) => set({ ws }),
      setSocketIO: (socket: Socket | null) => set({ socketIO: socket }),
      incrementReconnectAttempts: () =>
        set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
      resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
    }),
    { name: "WebSocket Store" }
  )
);

// ==================== Socket.IO Connection ====================
function connectWithSocketIO(userId: string, url: string, set: any, get: any) {
  console.log("🔌 Connecting with Socket.IO...");

  // Convert ws:// or wss:// to http:// or https://
  const httpUrl = url.replace(/^ws/, "http");

  const socket = io(httpUrl, {
    query: { userId },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    path: "/socket.io/",
  });

  socket.on("connect", () => {
    console.log("✅ Socket.IO connected");
    set({ isConnected: true, userId, connectionType: "socketio" });
    get().resetReconnectAttempts();
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket.IO disconnected:", reason);
    set({ isConnected: false });
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket.IO connection error:", error);
  });

  // Register all event handlers
  const handlers = get().eventHandlers;
  handlers.forEach(
    (handlerSet: Set<(payload: any) => void>, eventType: string) => {
      socket.on(eventType, (payload: any) => {
        console.log("📨 Socket.IO message:", eventType);
        handlerSet.forEach((handler) => {
          try {
            handler(payload);
          } catch (error) {
            console.error("Error in Socket.IO handler:", error);
          }
        });
      });
    }
  );

  set({ socketIO: socket });
}

// ==================== WebSocket Connection ====================
function connectWithWebSocket(userId: string, url: string, set: any, get: any) {
  console.log("🔌 Connecting with WebSocket...");

  const newWs = new WebSocket(`${url}?userId=${userId}`);

  newWs.onopen = () => {
    console.log("✅ WebSocket connected");
    set({ isConnected: true, userId, connectionType: "websocket" });
    get().resetReconnectAttempts();
  };

  newWs.onmessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log("📨 WebSocket message:", message.type);

      const handlers = get().eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler: (payload: any) => void) => {
          try {
            handler(message.payload);
          } catch (error) {
            console.error("Error in WebSocket handler:", error);
          }
        });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  newWs.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  newWs.onclose = (event) => {
    console.log("❌ WebSocket closed:", event.code, event.reason);
    set({ isConnected: false });

    // Attempt reconnection
    const { reconnectAttempts } = get();
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(
        `🔄 Reconnecting in ${delay}ms... (attempt ${
          reconnectAttempts + 1
        }/${MAX_RECONNECT_ATTEMPTS})`
      );

      reconnectTimeout = setTimeout(() => {
        get().incrementReconnectAttempts();
        get().connect(userId);
      }, delay);
    } else {
      console.error("❌ Max reconnection attempts reached");
    }
  };

  set({ ws: newWs });
}

// Convenience selectors
export const useWebSocketConnection = () =>
  useWebSocketStore((state) => ({
    isConnected: state.isConnected,
    connect: state.connect,
    disconnect: state.disconnect,
    reconnect: state.reconnect,
    connectionType: state.connectionType,
  }));

export const useWebSocketSend = () => useWebSocketStore((state) => state.send);

export const useWebSocketIsConnected = () =>
  useWebSocketStore((state) => state.isConnected);
