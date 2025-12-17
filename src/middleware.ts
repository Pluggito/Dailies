import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";

// Routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
];

// Routes that are always accessible (static files, etc.)
const alwaysAllowedPatterns = [
  /^\/_next/,
  /^\/favicon/,
  /^\/api\/uploadthing/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf)$/,
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static files and Next.js internals
  if (alwaysAllowedPatterns.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow profile routes to be viewed by anyone (public profiles)
  if (pathname.startsWith("/profile/")) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // No token, redirect to login for protected routes
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // For API routes, return 401
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify access token (now async)
  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    // Token invalid or expired
    // For API routes, return 401 so client knows to refresh
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Token expired", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }

    // For page routes, let them through - the page can handle refresh
    return NextResponse.next();
  }

  // Token valid, attach userId to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
