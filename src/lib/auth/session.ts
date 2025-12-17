import prisma from "@/lib/prisma";
import {
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
} from "./cookies";
import { verifyAccessToken, hashRefreshToken } from "./tokens";

interface SessionUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  image: string | null;
}

interface SessionResult {
  userId: string;
  user: SessionUser;
}

/**
 * Get the current session from cookies (for server components and actions)
 * @returns Session with userId and user data, or null if not authenticated
 */
export async function getSession(): Promise<SessionResult | null> {
  try {
    // Try access token first
    const accessToken = await getAccessTokenFromCookies();
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            image: true,
          },
        });
        if (user) {
          return { userId: user.id, user };
        }
      }
    }

    // Access token invalid/expired, try refresh token
    const refreshToken = await getRefreshTokenFromCookies();
    if (refreshToken) {
      const hashedToken = await hashRefreshToken(refreshToken);
      const session = await prisma.session.findUnique({
        where: { refreshToken: hashedToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (session && session.expiresAt > new Date()) {
        return { userId: session.userId, user: session.user };
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Require a valid session, throw if not authenticated
 * @throws Error if not authenticated
 */
export async function requireSession(): Promise<SessionResult> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Get just the user ID from session (lightweight check)
 * @returns User ID or null
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId || null;
}
