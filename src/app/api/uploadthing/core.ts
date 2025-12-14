import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  // For post images
  postImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        return { fileUrl: file.url };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error;
      }
    }),

  // For chat images
  chatImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      // Get chatRoomId from request headers or body
      const url = new URL(req.url);
      const chatRoomId = url.searchParams.get("chatRoomId");

      if (!chatRoomId) {
        throw new Error("Chat room ID is required");
      }

      // Verify user is a member of the chat
      const isMember = await prisma.chatMember.findUnique({
        where: {
          userId_chatRoomId: {
            userId: userId,
            chatRoomId: chatRoomId,
          },
        },
      });

      if (!isMember) {
        throw new Error("Not authorized to upload to this chat");
      }

      return { userId, chatRoomId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("✅ Chat image uploaded:", {
          userId: metadata.userId,
          chatRoomId: metadata.chatRoomId,
          fileUrl: file.url,
        });

        return {
          fileUrl: file.url,
          uploadedBy: metadata.userId,
          chatRoomId: metadata.chatRoomId,
        };
      } catch (error) {
        console.error("Error in chat image onUploadComplete:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
