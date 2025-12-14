"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface WebSocketMessage {
  type: string;
  payload: any;
}

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

interface WebSocketContextType {
  isConnected: boolean;
  send: (type: string, payload: any) => void;
  on: (type: string, handler: (payload: any) => void) => void;
  off: (type: string, handler: (payload: any) => void) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  userId?: string;
}

export function WebSocketProvider({
  children,
  userId,
}: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(payload: any) => void>>>(
    new Map()
  );
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId) {
      console.log("No userId provided, skipping WebSocket connection");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    try {
      const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
      const ws = new WebSocket(`${websocketUrl}?userId=${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", message.type);

          const handlers = eventHandlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(message.payload);
              } catch (error) {
                console.error("Error in message handler:", error);
              }
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error: Event) => {
        console.error("❌ WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log("❌ WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(
            `Reconnecting in ${delay}ms... (attempt ${
              reconnectAttemptsRef.current + 1
            }/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  }, [userId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      wsRef.current.send(message);
      console.log("📤 WebSocket message sent:", type);
    } else {
      console.warn("WebSocket is not connected. Cannot send message:", type);
    }
  }, []);

  const on = useCallback((type: string, handler: (payload: any) => void) => {
    if (!eventHandlersRef.current.has(type)) {
      eventHandlersRef.current.set(type, new Set());
    }
    eventHandlersRef.current.get(type)?.add(handler);
    console.log(`👂 Registered handler for: ${type}`);
  }, []);

  const off = useCallback((type: string, handler: (payload: any) => void) => {
    const handlers = eventHandlersRef.current.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(type);
      }
      console.log(`🔇 Unregistered handler for: ${type}`);
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log("Manual reconnect triggered");
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  const value: WebSocketContextType = {
    isConnected,
    send,
    on,
    off,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}

// Convenience hooks for specific features
export function useWebSocketMessage(handler: (message: Message) => void) {
  const { on, off } = useWebSocket();

  useEffect(() => {
    on("message:received", handler);
    return () => off("message:received", handler);
  }, [handler, on, off]);
}

export function useWebSocketChatList(
  handler: (data: { chatRoomId: string; message: Message }) => void
) {
  const { on, off } = useWebSocket();

  useEffect(() => {
    on("chatList:update", handler);
    return () => off("chatList:update", handler);
  }, [handler, on, off]);
}

export function useWebSocketTyping(
  chatRoomId: string,
  onTypingStart: (userId: string) => void,
  onTypingStop: (userId: string) => void
) {
  const { on, off } = useWebSocket();

  useEffect(() => {
    const handleTypingShow = (payload: {
      chatRoomId: string;
      userId: string;
    }) => {
      if (payload.chatRoomId === chatRoomId) {
        onTypingStart(payload.userId);
      }
    };

    const handleTypingHide = (payload: {
      chatRoomId: string;
      userId: string;
    }) => {
      if (payload.chatRoomId === chatRoomId) {
        onTypingStop(payload.userId);
      }
    };

    on("typing:show", handleTypingShow);
    on("typing:hide", handleTypingHide);

    return () => {
      off("typing:show", handleTypingShow);
      off("typing:hide", handleTypingHide);
    };
  }, [chatRoomId, onTypingStart, onTypingStop, on, off]);
}

export function useWebSocketReadReceipts(
  handler: (data: {
    chatRoomId: string;
    messageIds: string[];
    readBy: string;
  }) => void
) {
  const { on, off } = useWebSocket();

  useEffect(() => {
    on("message:readUpdate", handler);
    return () => off("message:readUpdate", handler);
  }, [handler, on, off]);
}
