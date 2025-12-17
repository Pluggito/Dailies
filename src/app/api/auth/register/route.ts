import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, name } = body;

    // Validate required fields
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-20 characters, alphanumeric and underscores only",
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Get device info
    const userAgent = req.headers.get("user-agent") || undefined;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined;

    // Create user and session in transaction
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash,
          name: name || null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      await tx.session.create({
        data: {
          userId: newUser.id,
          refreshToken: hashedRefreshToken,
          userAgent,
          ipAddress,
          expiresAt: getRefreshTokenExpiry(),
        },
      });

      return newUser;
    });

    // Generate access token (now async)
    const accessToken = await generateAccessToken(user.id);

    // Create response with cookies
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          image: user.image,
        },
      },
      { status: 201 }
    );

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
