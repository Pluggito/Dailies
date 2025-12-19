import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/chatroom/[chatroomId]/messages/unread
 * Get unread message count for a user
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chatroomId: string }> }
) {
  try {
    const { chatroomId } = await context.params;
    const chatRoomId = chatroomId;

    // Auth check using x-user-id header set by middleware
    const userId = req.headers.get("x-user-id");

    console.log("🔍 GET /messages/unread - Request:", {
      chatRoomId,
      userId,
    });

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count unread messages (messages not sent by user and not in readers array)
    const unreadCount = await prisma.message.count({
      where: {
        chatRoomId,
        userId: { not: userId }, // Don't count own messages
        NOT: {
          readers: {
            has: userId,
          },
        },
      },
    });

    console.log(`✅ Unread count: ${unreadCount}`);

    return NextResponse.json({
      chatRoomId,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET_UNREAD_COUNT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatroom/[chatroomId]/messages/unread
 * Mark messages as read for a user
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chatroomId: string }> }
) {
  try {
    const { chatroomId } = await context.params;
    const chatRoomId = chatroomId;

    // Auth check using x-user-id header set by middleware
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageIds } = body;

    console.log("🔍 POST /messages/unread - Request:", {
      chatRoomId,
      userId,
      messageCount: messageIds?.length || "all",
    });

    // If specific message IDs provided, mark only those as read
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      // Filter out messages that already have this user in readers
      const messagesToUpdate = await prisma.message.findMany({
        where: {
          id: { in: messageIds },
          chatRoomId,
          NOT: {
            readers: {
              has: userId,
            },
          },
        },
        select: { id: true },
      });

      if (messagesToUpdate.length > 0) {
        await prisma.$transaction(
          messagesToUpdate.map((msg) =>
            prisma.message.update({
              where: { id: msg.id },
              data: {
                readers: {
                  push: userId,
                },
              },
            })
          )
        );

        console.log(
          `✅ Marked ${messagesToUpdate.length} specific messages as read`
        );
      }

      // Update lastReadAt timestamp
      await prisma.chatMember.update({
        where: {
          userId_chatRoomId: {
            userId: userId,
            chatRoomId: chatRoomId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        markedCount: messagesToUpdate.length,
      });
    }

    // Otherwise, mark all unread messages in this chatroom as read
    const unreadMessages = await prisma.message.findMany({
      where: {
        chatRoomId,
        userId: { not: userId }, // Don't mark own messages
        NOT: {
          readers: {
            has: userId,
          },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.$transaction(
        unreadMessages.map((msg) =>
          prisma.message.update({
            where: { id: msg.id },
            data: {
              readers: {
                push: userId,
              },
            },
          })
        )
      );

      console.log(`✅ Marked ${unreadMessages.length} messages as read`);
    }

    // Update lastReadAt timestamp for the member
    await prisma.chatMember.update({
      where: {
        userId_chatRoomId: {
          userId: userId,
          chatRoomId: chatRoomId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      markedCount: unreadMessages.length,
    });
  } catch (error) {
    console.error("[MARK_AS_READ_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
