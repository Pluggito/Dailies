"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Smile,
  ImageIcon,
  Check,
  CheckCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatProps {
  showMobileChat: boolean;
  setShowMobileChat: (show: boolean) => void;
  activeConv: any;
  message: any;
  messages: any[];
  setMessage: (message: any) => void;
  setActiveConversation: (conversation: any) => void;
  formatTime: (time: Date) => string;
  formatMessageTime: (time: Date) => string;
  handleSend: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  typingUsers: Set<string>;
  currentUserId: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Chat({
  showMobileChat,
  setShowMobileChat,
  activeConv,
  message,
  messages,
  setMessage,
  formatTime,
  formatMessageTime,
  handleSend,
  messagesEndRef,
  typingUsers,
  currentUserId,
  open,
  setOpen,
}: ChatProps) {
  const isPartnerTyping = typingUsers.size > 0;

  const handleEmoji = (e: any) => {
    setMessage((prev: any) => prev + e.emoji);
    setOpen(false);
  };

  return (
    <>
      {/* Conversation Header */}
      <div className="h-16 border-b border-border px-4 md:px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowMobileChat(false)}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Avatar className="size-10">
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-violet-600 text-white font-medium">
              {activeConv?.name
                .split(" ")
                .map((n: any[]) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {activeConv?.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isPartnerTyping ? (
                <span className="text-primary">typing...</span>
              ) : activeConv?.online ? (
                "Active now"
              ) : (
                `Active ${formatTime(activeConv?.timestamp || new Date())}`
              )}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="More options"
        >
          <MoreVertical className="size-5" />
        </Button>
      </div>

      {/* Messages - floating bubbles with generous spacing */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.map((msg, index) => {
            const showAvatar =
              index === 0 ||
              messages[index - 1].sender.username !== msg.sender.username;
            const showTime =
              index === messages.length - 1 ||
              messages[index + 1].sender.username !== msg.sender.username;

            // Determine read status
            const isRead = msg.readers && msg.readers.length > 0;
            const readByOther = msg.readers?.some(
              (readerId: string) => readerId !== currentUserId
            );

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-end ${
                  msg.isOwn ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar - only show for first message in group */}
                {showAvatar ? (
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback
                      className={`${
                        msg.isOwn
                          ? "hidden"
                          : "bg-gradient-to-br from-pink-400 to-rose-600"
                      } text-white text-xs font-medium`}
                    >
                      {msg.sender.name
                        .split(" ")
                        .map((n: any[]) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="size-8 shrink-0" />
                )}

                {/* Message bubble */}
                <div
                  className={`flex flex-col ${
                    msg.isOwn ? "items-end" : "items-start"
                  } max-w-md`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-3xl ${
                      msg.isOwn
                        ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-br-md"
                        : "bg-card border border-border text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-pretty">
                      {msg.content}
                    </p>
                  </div>
                  {/* Timestamp and read receipts - only show for last message in group */}
                  {showTime && (
                    <div className="flex items-center gap-1 mt-1 px-2">
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                      {msg.isOwn && (
                        <span className="text-muted-foreground">
                          {readByOther ? (
                            <CheckCheck className="size-3 text-blue-500" />
                          ) : isRead ? (
                            <CheckCheck className="size-3" />
                          ) : (
                            <Check className="size-3" />
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isPartnerTyping && (
            <div className="flex gap-3 items-end">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-600 text-white text-xs font-medium">
                  {activeConv?.name
                    .split(" ")
                    .map((n: any[]) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="px-4 py-3 rounded-3xl bg-card border border-border rounded-bl-md">
                <div className="flex gap-1">
                  <span
                    className="size-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="size-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - clean and spacious */}
      <div className="p-3 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex-1 rounded-3xl border border-border focus-within:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 px-4 py-2 ">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Attach image"
                >
                  <ImageIcon className="size-4" />
                </Button>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground p-0 h-auto py-2  "
                />
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(!open)}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground shrink-0 mb-1 "
                      aria-label="Add emoji"
                    >
                      <Smile className="size-4" />
                    </Button>
                  </motion.button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        className="absolute bottom-12 -right-14 sm:right-0 z-50 max-w-[90vw] sm:max-w-xs"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EmojiPicker
                          onEmojiClick={handleEmoji}
                          width={375}
                          height={375}
                          className="ml-7 bg-black lg:ml-0"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              className="size-11 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-500/25 shrink-0 rounded-full cursor-pointer"
              disabled={!message.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
