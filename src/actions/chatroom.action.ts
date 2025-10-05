'use server'

import prisma from '@/lib/prisma'

export async function createOrGetChatroom(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) throw new Error("You can't chat with yourself.")

  // Check if existing 1-on-1 chat room
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      isGroup: false,
      members: {
        some: { id: currentUserId },
      },
      AND: {
        members: {
          some: { id: targetUserId },
        }
      }
    },
    include: {
      members: true,
    }
  });

  if (
    existingRoom &&
    existingRoom.members.length === 2 &&
    existingRoom.members.some(u => u.id === currentUserId) &&
    existingRoom.members.some(u => u.id === targetUserId)
  ) {
    return existingRoom.id;
  }

  // Create new chatroom
  const newRoom = await prisma.chatRoom.create({
    data: {
      isGroup: false,
      members: {
        connect: [
          { id: currentUserId },
          { id: targetUserId }
        ]
      }
    }
  });

  return newRoom.id;
}


