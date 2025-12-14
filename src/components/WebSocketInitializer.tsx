"use client";

import { useEffect } from "react";
import { useWebSocketStore } from "@/store/useWebSocketStore";

interface WebSocketInitializerProps {
  userId?: string;
}

export function WebSocketInitializer({ userId }: WebSocketInitializerProps) {
  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);

  useEffect(() => {
    if (userId) {
      connect(userId);
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return null; // This component doesn't render anything
}
