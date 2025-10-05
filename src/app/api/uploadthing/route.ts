import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

const handler  = createRouteHandler({
  router: ourFileRouter,
});

export { handler as GET, handler as POST };