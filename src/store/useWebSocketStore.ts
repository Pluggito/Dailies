import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  isConnected: boolean;
  userId: string | null;
  reconnectAttempts: number;

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
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Get WebSocket URL based on environment
const getWebSocketUrl = () => {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return process.env.NEXT_PUBLIC_WS_SERVER_URL || "ws://localhost:8085";
  }

  // Production - use environment variable
  return process.env.NEXT_PUBLIC_WS_SERVER_URL || "";
};

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      ws: null,
      isConnected: false,
      userId: null,
      reconnectAttempts: 0,
      eventHandlers: new Map(),

      connect: (userId: string) => {
        const { ws, isConnected } = get();

        // Don't reconnect if already connected
        if (isConnected) {
          console.log("Already connected");
          return;
        }

        // Close existing connection
        if (ws) ws.close();

        try {
          const wsUrl = getWebSocketUrl();

          if (!wsUrl) {
            console.error("❌ WebSocket URL not configured");
            return;
          }

          console.log("🔌 Connecting to:", wsUrl);
          connectWithWebSocket(userId, wsUrl, set, get);
        } catch (error) {
          console.error("Error creating connection:", error);
        }
      },

      disconnect: () => {
        const { ws } = get();
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        if (ws) {
          ws.close();
          set({ ws: null });
        }
        set({ isConnected: false, userId: null });
      },

      send: (type: string, payload: any) => {
        const { ws, isConnected } = get();

        if (!isConnected || ws?.readyState !== WebSocket.OPEN) {
          console.warn("⚠️ Not connected. Cannot send:", type);
          return;
        }

        const message = JSON.stringify({ type, payload });
        ws.send(message);
        console.log("📤 Sent:", type);
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
      incrementReconnectAttempts: () =>
        set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
      resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
    }),
    { name: "WebSocket Store" }
  )
);

// ==================== WebSocket Connection ====================
function connectWithWebSocket(userId: string, url: string, set: any, get: any) {
  console.log("🔌 Connecting with WebSocket...");

  const newWs = new WebSocket(`${url}?userId=${userId}`);

  newWs.onopen = () => {
    console.log("✅ WebSocket connected");
    set({ isConnected: true, userId });
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
  }));

export const useWebSocketSend = () => useWebSocketStore((state) => state.send);

export const useWebSocketIsConnected = () =>
  useWebSocketStore((state) => state.isConnected);
