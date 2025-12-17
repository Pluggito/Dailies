"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWebSocketStore } from "@/store/useWebSocketStore";

export function WebSocketInitializer() {
  const { userId, isLoaded } = useAuth();
  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);

  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      connect(userId);
    }

    return () => {
      disconnect();
    };
  }, [userId, isLoaded, connect, disconnect]);

  return null;
}
