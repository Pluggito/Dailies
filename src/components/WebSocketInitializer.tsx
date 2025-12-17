"use client";

import { useEffect } from "react";
import { useUser } from "./AuthProvider";
import { useWebSocketStore } from "@/store/useWebSocketStore";

export function WebSocketInitializer() {
  const { user, isLoaded } = useUser();
  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      connect(user.id);
    }

    return () => {
      disconnect();
    };
  }, [user, isLoaded, connect, disconnect]);

  return null;
}
