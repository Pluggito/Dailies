import { Suspense } from "react";
import { ChatRoom } from "@/components/chat-room";

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatRoom />
    </Suspense>
  );
}
