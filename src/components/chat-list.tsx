"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Edit } from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  online: boolean;
  image?: string;
}

interface ChatListProps {
  conversations: Conversation[];
  activeConversation: string;
  setActiveConversation: (id: string) => void;
  setShowMobileChat: (show: boolean) => void;
  showMobileChat: boolean;
  formatTime: (date: Date) => string;
}

export default function ChatList({
  conversations,
  activeConversation,
  setActiveConversation,
  setShowMobileChat,
  showMobileChat,
  formatTime,
}: ChatListProps) {
  return (
    <div
      className={`w-full md:w-80 border-r border-border flex-col bg-background/50 ${
        showMobileChat ? "hidden md:flex" : "flex"
      }`}
    >
      {/* Header with search */}
      <div className="p-4 border-b border-border bg-background ">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-primary">Messages</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-foreground"
              aria-label="New message"
            >
              <Edit className="size-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations"
            className="pl-9 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring/20"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto bg-background">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => {
              setActiveConversation(conv.id);
              setShowMobileChat(true);
            }}
            className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
              activeConversation === conv.id ? "bg-secondary" : ""
            }`}
          >
            <div className="relative shrink-0">
              <Avatar className="size-12">
                {conv.image ? (
                  <img
                    src={conv.image || "/placeholder.svg"}
                    alt={`${conv.name}'s avatar`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-violet-600 text-white font-medium">
                    {conv.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              {conv.online && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-card" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {conv.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {formatTime(conv.timestamp)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span className="ml-2 shrink-0 size-5 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs font-medium">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
