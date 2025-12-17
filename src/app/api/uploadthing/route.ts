import { createRouteHandler } from "uploadthing/next";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  postImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await auth();

      if (!userId) {
        throw new Error("Unauthorized - User not found");
      }

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      //  console.log("✅ Image upload complete!");
      //  console.log("  User ID:", metadata.userId);
      //  console.log("  File URL:", file.ufsUrl);

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Create the route handler
const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

export { GET, POST };
