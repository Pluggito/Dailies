import { createRouteHandler } from "uploadthing/next";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const { userId } = await auth();

      if (!userId) {
        throw new Error("Unauthorized - User not found");
      }

      // Get chatRoomId from headers or query params if needed
      const url = new URL(req.url);
      const chatRoomId = url.searchParams.get("chatRoomId");

      if (chatRoomId) {
        // Verify user has access to this chat room
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
      }

      return { userId, chatRoomId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Image upload complete!");
      console.log("  User ID:", metadata.userId);
      console.log("  Chat Room ID:", metadata.chatRoomId);
      console.log("  File URL:", file.url);
      console.log("  File Size:", (file.size / 1024).toFixed(2) + "KB");

      return {
        uploadedBy: metadata.userId,
        url: file.url,
        chatRoomId: metadata.chatRoomId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Create the route handler
const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

export { GET, POST };
