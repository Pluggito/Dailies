"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import ChatList from "./chat-list";
import Chat from "./chat";
import {
  getFollowers,
  getChatMessages,
  getDbUserId,
} from "@/actions/user.action";
import axios from "axios";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useSearchParams } from "next/navigation";

interface Message {
  id: string;
  content: string;
  sender: {
    name: string;
    username: string;
    avatar: string;
  };
  timestamp: Date;
  isOwn: boolean;
  readers?: string[];
}

interface Conversation {
  id: string;
  name: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  online: boolean;
  image?: string;
  otherUserId: string;
}

export function ChatRoom() {
  const [message, setMessage] = useState("");
  const [activeConversation, setActiveConversation] = useState("");
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Use refs to avoid stale closures
  const currentUserIdRef = useRef<string | null>(null);
  const activeConversationRef = useRef<string>("");
  const activeChatRoomIdRef = useRef<string | null>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get("userId");
  const urlUserIdProcessedRef = useRef(false);

  // WebSocket connection
  const { send, on, off, isConnected } = useWebSocketStore();

  // Update refs when state changes
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    activeChatRoomIdRef.current = activeChatRoomId;
  }, [activeChatRoomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        const userId = await getDbUserId();
        setCurrentUserId(userId);

        if (!userId) return;

        const res = await axios.get("/api/chatroom");
        const rooms = res.data;

        const mappedConversations: Conversation[] = rooms.map((room: any) => {
          // Identify the other participant
          const otherMember = room.members.find(
            (m: any) => m.userId !== userId
          );
          const otherUser = otherMember?.user || {
            name: "Unknown",
            username: "unknown",
            image: "",
          };

          return {
            id: room.id, // Use ChatRoom ID
            name: otherUser.name || otherUser.username,
            username: otherUser.username,
            lastMessage:
              room.messages[0]?.content ||
              (room.messages[0]?.mediaUrl
                ? "Sent an attachment"
                : "No messages"),
            timestamp: new Date(room.updatedAt),
            unread: 0, // TODO: Implement unread count logic if needed
            online: false,
            image: otherUser.image || "",
            otherUserId: otherUser.id,
          };
        });
        setConversations(mappedConversations);

        // Handle URL userId param
        if (urlUserId && !urlUserIdProcessedRef.current) {
          urlUserIdProcessedRef.current = true;
          const existingConv = mappedConversations.find(
            (c) => c.otherUserId === urlUserId
          );

          if (existingConv) {
            handleSelectConversation(existingConv.id);
          } else {
            // Create new room
            try {
              const res = await axios.post("/api/chatroom", {
                currentUserId: userId,
                otherUserId: urlUserId,
              });
              const newRoom = res.data;

              // Check if it's already in the list (race condition?)
              const alreadyExists = mappedConversations.find(
                (c) => c.id === newRoom.id
              );

              if (!alreadyExists) {
                // Find other user details - we might need to fetch them if not in room response?
                // The POST response includes members.
                const otherMember = newRoom.members.find(
                  (m: any) => m.userId !== userId
                );
                const otherUser = otherMember?.user || {
                  name: "User",
                  username: "user",
                  image: "",
                };

                const newConv: Conversation = {
                  id: newRoom.id,
                  name: otherUser.name || otherUser.username,
                  username: otherUser.username,
                  lastMessage: "New chat",
                  timestamp: new Date(),
                  unread: 0,
                  online: false,
                  image: otherUser.image || "",
                  otherUserId: otherUser.id,
                };

                setConversations((prev) => [newConv, ...prev]);
                handleSelectConversation(newRoom.id);
              } else {
                handleSelectConversation(newRoom.id);
              }
            } catch (err) {
              console.error("Failed to create chat from URL", err);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      }
    };
    initData();
  }, []);

  // Stable message handler using refs
  const handleMessageReceived = useCallback(
    (payload: any) => {
      // Check if we've already processed this message
      if (processedMessageIdsRef.current.has(payload.id)) {
        // console.log("Duplicate message detected, skipping:", payload.id);
        return;
      }

      // Verify it's for the active room
      if (payload.chatRoomId !== activeChatRoomIdRef.current) {
        // console.log("Message for different room, skipping");
        return;
      }

      // Mark as processed
      processedMessageIdsRef.current.add(payload.id);

      const newMessage: Message = {
        id: payload.id,
        content:
          payload.content || (payload.mediaUrl ? "Sent an attachment" : ""),
        sender: {
          name: payload.sender.name || payload.sender.username,
          username: payload.sender.username,
          avatar: payload.sender.image || "",
        },
        timestamp: new Date(payload.createdAt),
        isOwn: payload.senderId === currentUserIdRef.current,
        readers: payload.readers || [],
      };

      setMessages((prev) => {
        // Double-check for duplicates in state
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Auto-mark as read if not own message
      if (!newMessage.isOwn) {
        setTimeout(() => {
          send("messages:read", {
            chatRoomId: payload.chatRoomId,
            messageIds: [payload.id],
          });
        }, 1000); // Mark as read after 1 second
      }
    },
    [send]
  );

  const handleChatListUpdate = useCallback((payload: any) => {
    const { message: msgPayload, chatRoomId } = payload; // Assuming payload has chatRoomId

    setConversations((prev) => {
      // Check if conversation exists
      const existingConv = prev.find((c) => c.id === chatRoomId);

      if (existingConv) {
        return prev.map((conv) => {
          if (conv.id === chatRoomId) {
            return {
              ...conv,
              lastMessage:
                msgPayload.content ||
                (msgPayload.mediaUrl ? "Sent an attachment" : ""),
              timestamp: new Date(msgPayload.createdAt),
              unread:
                activeConversationRef.current === conv.id ? 0 : conv.unread + 1,
            };
          }
          return conv;
        });
      } else {
        // New conversation? We might need to fetch it or add it.
        // For simplicity, we can trigger a re-fetch of the list or ignore if handled elsewhere.
        // A better approach is to optimistically add it if we have details, but we probably need to fetch the room details.
        // For now, let's just ignore or maybe reload.
        return prev;
      }
    });
  }, []);

  // Handle typing indicators
  const handleTypingShow = useCallback((payload: any) => {
    if (payload.chatRoomId !== activeChatRoomIdRef.current) return;
    if (payload.userId === currentUserIdRef.current) return; // Don't show own typing

    setTypingUsers((prev) => new Set([...prev, payload.userId]));
  }, []);

  const handleTypingHide = useCallback((payload: any) => {
    if (payload.chatRoomId !== activeChatRoomIdRef.current) return;

    setTypingUsers((prev) => {
      const next = new Set(prev);
      next.delete(payload.userId);
      return next;
    });
  }, []);

  // Handle read receipts
  const handleMessagesRead = useCallback((payload: any) => {
    if (payload.chatRoomId !== activeChatRoomIdRef.current) return;

    const { userId, messageIds } = payload;

    // Update messages to add reader
    setMessages((prev) =>
      prev.map((msg) => {
        if (messageIds && messageIds.includes(msg.id)) {
          return {
            ...msg,
            readers: [...(msg.readers || []), userId],
          };
        }
        return msg;
      })
    );
  }, []);

  // Register WebSocket listeners
  useEffect(() => {
    if (!isConnected) return;

    // console.log("Registering WebSocket handlers");
    on("message:received", handleMessageReceived);
    on("chatList:update", handleChatListUpdate);
    on("typing:show", handleTypingShow);
    on("typing:hide", handleTypingHide);
    on("messages:read", handleMessagesRead);

    return () => {
      // console.log("Unregistering WebSocket handlers");
      off("message:received", handleMessageReceived);
      off("chatList:update", handleChatListUpdate);
      off("typing:show", handleTypingShow);
      off("typing:hide", handleTypingHide);
      off("messages:read", handleMessagesRead);
    };
  }, [
    isConnected,
    on,
    off,
    handleMessageReceived,
    handleChatListUpdate,
    handleTypingShow,
    handleTypingHide,
    handleMessagesRead,
  ]);

  // Room management - join/leave
  useEffect(() => {
    if (!activeChatRoomId || !isConnected) return;

    // console.log("Joining room:", activeChatRoomId);
    send("joinRoom", { chatRoomId: activeChatRoomId });

    return () => {
      // console.log("Leaving room:", activeChatRoomId);
      send("leaveRoom", { chatRoomId: activeChatRoomId });

      // Clear typing indicator when leaving
      if (isTyping) {
        send("typing:stop", { chatRoomId: activeChatRoomId });
        setIsTyping(false);
      }

      // Clear typing users
      setTypingUsers(new Set());
    };
  }, [activeChatRoomId, isConnected, send, isTyping]);

  // Auto-mark messages as read when viewing conversation
  useEffect(() => {
    if (!activeChatRoomId || !currentUserId || !isConnected) return;

    const unreadMessages = messages.filter(
      (msg) => !msg.isOwn && !msg.readers?.includes(currentUserId)
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg.id);

      // Delay to simulate "viewing" the messages
      const timer = setTimeout(() => {
        send("messages:read", {
          chatRoomId: activeChatRoomId,
          messageIds,
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages, activeChatRoomId, currentUserId, isConnected, send]);

  const handleSelectConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);
    setShowMobileChat(true);
    setActiveChatRoomId(conversationId); // In this new model, ID is the ChatRoom ID

    if (!currentUserId) return;

    try {
      // Clear previous messages immediately
      setMessages([]);
      setTypingUsers(new Set());
      processedMessageIdsRef.current.clear();

      // Fetch messages using the API or action
      const dbMessages = await getChatMessages(conversationId);

      // Filter out system messages and map to Message format
      const refinedMessages: Message[] = dbMessages
        .filter((msg: any) => !msg.system)
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content || "",
          sender: {
            name: msg.user.name || msg.user.username,
            username: msg.user.username,
            avatar: msg.user.image || "",
          },
          timestamp: new Date(msg.createdAt),
          isOwn: msg.userId === currentUserId,
          readers: msg.readers || [],
        }));

      // Mark all fetched messages as processed
      refinedMessages.forEach((msg) => {
        processedMessageIdsRef.current.add(msg.id);
      });

      setMessages(refinedMessages);

      // Reset unread count for this conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error entering chat:", error);
    }
  };

  // Handle typing with debounce
  const handleMessageChange = (value: string) => {
    setMessage(value);

    if (!activeChatRoomId || !isConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      // Start typing if not already
      if (!isTyping) {
        setIsTyping(true);
        send("typing:start", { chatRoomId: activeChatRoomId });
      }

      // Auto-stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        send("typing:stop", { chatRoomId: activeChatRoomId });
      }, 3000);
    } else {
      // Stop typing if input is empty
      if (isTyping) {
        setIsTyping(false);
        send("typing:stop", { chatRoomId: activeChatRoomId });
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChatRoomId) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      send("typing:stop", { chatRoomId: activeChatRoomId });
    }

    send("message:send", {
      chatRoomId: activeChatRoomId,
      content: message,
      type: "TEXT",
    });

    setMessage("");
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return "just now";
    if (hours < 24)
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    if (hours < 48) return "yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const activeConv = conversations.find((c) => c.id === activeConversation);

  return (
    <div className="flex h-[calc(100vh-8rem)] text-foreground bg-card rounded-lg overflow-hidden border border-border shadow-sm">
      <ChatList
        conversations={conversations}
        activeConversation={activeConversation}
        setActiveConversation={handleSelectConversation}
        setShowMobileChat={setShowMobileChat}
        showMobileChat={showMobileChat}
        formatTime={formatTime}
      />

      <div
        className={`flex-1 flex-col ${
          showMobileChat ? "flex" : "hidden md:flex"
        }`}
      >
        <Chat
          showMobileChat={showMobileChat}
          setShowMobileChat={setShowMobileChat}
          activeConv={activeConv}
          message={message}
          messages={messages}
          setMessage={handleMessageChange}
          setActiveConversation={handleSelectConversation}
          formatTime={formatTime}
          formatMessageTime={formatMessageTime}
          handleSend={handleSend}
          messagesEndRef={messagesEndRef}
          typingUsers={typingUsers}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
