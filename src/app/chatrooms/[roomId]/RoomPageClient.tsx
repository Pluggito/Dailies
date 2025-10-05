"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, InfoIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


interface RoomPageProps {
  roomId: string;
  targetUser: {
    username?: string;
    fullName?: string;
    imageUrl?: string;
  };
}

export default function RoomPage({ roomId, targetUser}: RoomPageProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");


  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Chatroom ID: {roomId}</h1>
      <div className="flex items-center justify-between">
        <ArrowLeft />
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-16 h-16">
            <AvatarImage src={targetUser.imageUrl ?? "/avatar.png"} />
          </Avatar>
          <h1 className="mt-4 text-2xl font-bold">
            {targetUser.fullName ?? targetUser.username ?? "Unknown"}
          </h1>
        </div>
        <InfoIcon />
      </div>

      <div className="space-y-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-200 p-2 rounded">
            {msg}
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            placeholder="Type a message..."
          />
          <Button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
