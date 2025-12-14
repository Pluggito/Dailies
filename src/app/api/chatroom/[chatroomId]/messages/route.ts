import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/actions/user.action";

/**
 * GET /api/chatroom/[chatroomId]/messages
 * Fetch messages for a chat room
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chatroomId: string }> }
) {
  try {
    const { chatroomId } = await context.params;
    const chatRoomId = chatroomId;
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 50);
    const userId = req.headers.get("x-user-id");

    const skip = (page - 1) * limit;

    console.log("🔍 GET /messages - Request:", {
      chatRoomId,
      page,
      limit,
      userId,
    });

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId,
        system: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    });

    console.log(`✅ Found ${messages.length} messages`);

    const transformed = messages.map((message) => ({
      id: message.id,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      duration: message.duration,
      createdAt: message.createdAt,
      senderId: message.userId,
      sender: {
        id: message.user.id,
        name: message.user.name,
        username: message.user.username,
        image: message.user.image,
      },
      readers: message.readers,
      system: message.system,
      chatRoomId: message.chatRoomId,
      isRead: userId ? message.readers.includes(userId) : false,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("[GET_MESSAGES_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatroom/[chatroomId]/messages
 * Send a message
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chatroomId: string }> }
) {
  try {
    const { chatroomId } = await context.params;
    const chatRoomId = chatroomId;
    const body = await req.json();

    const {
      senderId,
      content,
      type = "TEXT",
      mediaUrl = null,
      duration = null,
    } = body;

    console.log("🔍 POST /messages - Received:", {
      chatRoomId,
      senderId,
      type,
      hasContent: !!content,
      hasMediaUrl: !!mediaUrl,
    });

    // Validate message type
    const validTypes = ["TEXT", "IMAGE", "AUDIO", "SYSTEM"];
    if (!validTypes.includes(type)) {
      console.error("❌ Invalid message type:", type);
      return NextResponse.json(
        { error: "Invalid message type" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!senderId) {
      console.error("❌ Missing senderId");
      return NextResponse.json(
        { error: "Sender ID is required" },
        { status: 400 }
      );
    }

    if (type === "TEXT" && !content) {
      console.error("❌ Missing content for TEXT message");
      return NextResponse.json(
        { error: "Content is required for text messages" },
        { status: 400 }
      );
    }

    if ((type === "IMAGE" || type === "AUDIO") && !mediaUrl) {
      console.error("❌ Missing mediaUrl for IMAGE/AUDIO message");
      return NextResponse.json(
        { error: "Media URL is required for image/audio messages" },
        { status: 400 }
      );
    }

    // First, check if the chat room exists
    const chatRoomExists = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: { id: true },
    });

    if (!chatRoomExists) {
      console.error("❌ Chat room not found:", chatRoomId);
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 }
      );
    }

    console.log("✅ Chat room exists:", chatRoomId);

    // Get the actual database user ID from Clerk ID
    const dbUser = await getUserByClerkId(String(senderId));

    if (!dbUser) {
      console.error("❌ User not found in database:", senderId);
      return NextResponse.json(
        { error: "User not found. Please ensure you are logged in." },
        { status: 404 }
      );
    }

    const actualUserId = dbUser.id;
    console.log("✅ User found:", { clerkId: senderId, dbId: actualUserId });

    // Check if user is a member, if not, add them automatically
    let membership = await prisma.chatMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: actualUserId,
          chatRoomId: chatRoomId,
        },
      },
    });

    if (!membership) {
      console.log("⚠️ User not a member, adding them automatically...");

      // Add user as a member using the actual database user ID
      membership = await prisma.chatMember.create({
        data: {
          userId: actualUserId,
          chatRoomId: chatRoomId,
          lastReadAt: new Date(),
        },
      });

      console.log("✅ User automatically added as member:", membership.id);
    } else {
      console.log("✅ User is already a member");
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        chatRoomId,
        userId: actualUserId, // Use actual database user ID
        content: content || null,
        type,
        mediaUrl,
        duration,
        readers: [],
        system: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    console.log("✅ Message created:", message.id);

    // Update chat room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() },
    });

    // Transform message for response
    const transformedMessage = {
      id: message.id,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      duration: message.duration,
      createdAt: message.createdAt,
      senderId: message.userId,
      sender: {
        id: message.user.id,
        name: message.user.name,
        username: message.user.username,
        image: message.user.image,
      },
      readers: message.readers,
      system: message.system,
      chatRoomId: message.chatRoomId,
    };

    console.log("✅ Message saved and transformed successfully");

    return NextResponse.json(transformedMessage, { status: 201 });
  } catch (error) {
    console.error("[SEND_MESSAGE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
