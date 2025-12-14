import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { currentUserId, otherUserId } = body;

  if (!currentUserId || !otherUserId) {
    return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });
  }

  // Find or create in ONE transaction
  const chatRoom = await prisma.$transaction(async (tx) => {
    // Try to find existing chat
    let existingRoom = await tx.chatRoom.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId: String(currentUserId) } } },
          { members: { some: { userId: String(otherUserId) } } },
        ],
      },
      include: {
        members: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: true },
        },
      },
    });

    // Create if doesn't exist
    if (!existingRoom) {
      existingRoom = await tx.chatRoom.create({
        data: {
          type: "direct",
          members: {
            create: [
              { userId: String(currentUserId) },
              { userId: String(otherUserId) },
            ],
          },
          // DON'T create system message here - removed
        },
        include: {
          members: {
            include: { user: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { user: true },
          },
        },
      });
    }

    return existingRoom;
  });

  return NextResponse.json(chatRoom);
}
