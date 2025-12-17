import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth/tokens";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Hash the token to look it up (now async)
    const hashedToken = await hashRefreshToken(refreshToken);

    // Find the session
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

    // Session not found or expired
    if (!session) {
      const response = NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      const response = NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Token rotation: generate new tokens (now async)
    const newAccessToken = await generateAccessToken(session.userId);
    const newRefreshToken = generateRefreshToken();
    const newHashedRefreshToken = await hashRefreshToken(newRefreshToken);

    // Get updated device info
    const userAgent = req.headers.get("user-agent") || session.userAgent;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || session.ipAddress;

    // Update session with new refresh token (rotation)
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newHashedRefreshToken,
        userAgent,
        ipAddress,
        expiresAt: getRefreshTokenExpiry(),
        lastUsedAt: new Date(),
      },
    });

    // Create response with new cookies
    const response = NextResponse.json({
      user: session.user,
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);

    return response;
  } catch (error) {
    console.error("[REFRESH_ERROR]", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}
