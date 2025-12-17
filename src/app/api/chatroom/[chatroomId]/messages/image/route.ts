import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chatRoomId } = await params;
    const { imageUrl, caption } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of this chat room
    const isMember = await prisma.chatMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: userId,
          chatRoomId: chatRoomId,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Not authorized to send messages to this chat" },
        { status: 403 }
      );
    }

    // Create the image message
    const message = await prisma.message.create({
      data: {
        chatRoomId: chatRoomId,
        userId: userId,
        content: caption || null,
        type: "IMAGE",
        mediaUrl: imageUrl,
        readers: [],
        system: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update chatroom timestamp
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() },
    });

    const transformedMessage = {
      id: message.id,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      duration: message.duration,
      createdAt: message.createdAt,
      senderId: message.userId,
      sender: message.user,
      readers: message.readers,
      system: message.system,
      chatRoomId: message.chatRoomId,
    };

    console.log("✅ Image message sent:", {
      messageId: message.id,
      imageUrl,
      chatRoomId,
      hasCaption: !!caption,
    });

    // Note: WebSocket broadcasting should be handled by your WebSocket server
    return NextResponse.json(transformedMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending image message:", error);
    return NextResponse.json(
      { error: "Failed to send image message" },
      { status: 500 }
    );
  }
}
