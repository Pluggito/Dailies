import prisma from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userChatRooms = await prisma.chatRoom.findMany({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
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
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedUserChatRooms = userChatRooms.map((chatRoom) => ({
    ...chatRoom,
    lastMessage: chatRoom.messages[0] || null,
    unreadCount:
      chatRoom._count.messages -
      (chatRoom.members.find((member) => member.userId === userId)?.lastReadAt
        ? 1
        : 0),
  }));

  return NextResponse.json(formattedUserChatRooms);
}
