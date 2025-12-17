import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        image: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(ip);

    // Get device info
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = ip !== "unknown" ? ip : undefined;

    // Generate tokens (now async)
    const accessToken = await generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        userAgent,
        ipAddress,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Create response with cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
      },
    });

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
