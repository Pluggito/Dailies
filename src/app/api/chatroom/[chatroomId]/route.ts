import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatroomId: string }> }
) {
  try {
    const reqParams = await params;
    const { chatroomId } = reqParams;

    const chatRoom = await prisma.chatRoom.findFirst({
      where: { id: chatroomId },
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

    if (!chatRoom) {
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat room" },
      { status: 500 }
    );
  }
}