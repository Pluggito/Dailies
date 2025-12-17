import { createRouteHandler } from "uploadthing/next";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";

const f = createUploadthing();

export const ourFileRouter = {
  postImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Get access token from cookies
      const accessToken = await getAccessTokenFromCookies();

      if (!accessToken) {
        throw new Error("Unauthorized - No token");
      }

      const payload = await verifyAccessToken(accessToken);
      if (!payload) {
        throw new Error("Unauthorized - Invalid token");
      }

      return { userId: payload.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
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
