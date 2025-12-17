import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashRefreshToken, verifyAccessToken } from "@/lib/auth/tokens";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const logoutAll = searchParams.get("all") === "true";

    // Get tokens from cookies
    const accessToken = req.cookies.get("access_token")?.value;
    const refreshToken = req.cookies.get("refresh_token")?.value;

    // If no tokens, just clear cookies and return success
    if (!accessToken && !refreshToken) {
      const response = NextResponse.json({ message: "Logged out" });
      clearAuthCookies(response);
      return response;
    }

    let userId: string | null = null;

    // Try to get userId from access token (now async)
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        userId = payload.userId;
      }
    }

    // If no userId from access token, try refresh token (now async)
    if (!userId && refreshToken) {
      const hashedToken = await hashRefreshToken(refreshToken);
      const session = await prisma.session.findUnique({
        where: { refreshToken: hashedToken },
        select: { userId: true },
      });
      if (session) {
        userId = session.userId;
      }
    }

    if (userId) {
      if (logoutAll) {
        // Delete ALL sessions for this user (logout all devices)
        await prisma.session.deleteMany({
          where: { userId },
        });
      } else if (refreshToken) {
        // Delete only current session
        const hashedToken = await hashRefreshToken(refreshToken);
        await prisma.session.deleteMany({
          where: { refreshToken: hashedToken },
        });
      }
    }

    // Clear cookies
    const response = NextResponse.json({
      message: logoutAll ? "Logged out from all devices" : "Logged out",
    });
    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);
    // Still clear cookies even on error
    const response = NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
    clearAuthCookies(response);
    return response;
  }
}
