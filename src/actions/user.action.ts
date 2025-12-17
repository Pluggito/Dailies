"use server";

import prisma from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

/**
 * Get the current user's database ID from session
 * @returns User ID or null if not authenticated
 */
export async function getDbUserId(): Promise<string | null> {
  return getSessionUserId();
}

/**
 * Get random users to suggest following (excludes current user and already followed)
 */
export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return [];

    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });
    return randomUsers;
  } catch (error) {
    console.error("failed to get Users", error);
    return [];
  }
}

/**
 * Toggle follow/unfollow a user
 */
export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("You can't follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),
        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId,
            creatorId: userId,
          },
        }),
      ]);
    }

    return { success: true };
  } catch (error) {
    console.log("error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const userId = await getDbUserId();
  if (!userId) return;
  return await prisma.user.findUnique({
    where: { username },
  });
}

/**
 * Get followers of current user
 */
export async function getFollowers() {
  const userId = await getDbUserId();
  if (!userId) return [];

  const followers = await prisma.follows.findMany({
    where: {
      followingId: userId,
    },
    include: {
      follower: true,
    },
  });

  return followers.map((f) => f.follower);
}

/**
 * Get chat messages for a room
 */
export async function getChatMessages(chatRoomId: string) {
  const userId = await getDbUserId();
  if (!userId) return [];

  const messages = await prisma.message.findMany({
    where: {
      chatRoomId,
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
    orderBy: {
      createdAt: "asc",
    },
  });

  return messages;
}
