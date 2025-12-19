"use server";

import prisma from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProfileByUsername(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching profile:", error);
    // Return null instead of throwing to allow proper 404 handling
    return null;
  }
}

export async function getUserPosts(userId: string) {
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
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
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    // Return empty array instead of throwing
    return [];
  }
}

export async function getUserLikedPosts(userId: string) {
  try {
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
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
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return likedPosts;
  } catch (error) {
    console.error("Error fetching user liked posts:", error);
    // Return empty array instead of throwing
    return [];
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const userId = await getSessionUserId();
    if (!userId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        location,
        website,
      },
    });

    revalidatePath("/profile");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function isFollowing(userId: string) {
  try {
    const currentUserId = await getSessionUserId();
    if (!currentUserId) return false;

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return !!follow;
  } catch (err) {
    console.error("Error checking follow status:", err);
    return false;
  }
}

export async function getUserFollowers(userId: string) {
  try {
    const currentUserId = await getSessionUserId();
    if (!currentUserId) return [];

    const followers = await prisma.follows.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const followersWithStatus = await Promise.all(
      followers.map(async (f) => ({
        ...f.follower,
        isFollowedByCurrentUser: currentUserId
          ? await isFollowing(f.follower.id)
          : false,
      }))
    );

    return followersWithStatus;
  } catch (err) {
    console.error("Error fetching followers:", err);
    return [];
  }
}

export async function getUserFollowing(userId: string) {
  try {
    const currentUserId = await getSessionUserId();

    const following = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if current user follows each person
    const followingWithStatus = await Promise.all(
      following.map(async (f) => ({
        ...f.following,
        isFollowedByCurrentUser: currentUserId
          ? await isFollowing(f.following.id)
          : false,
      }))
    );

    return followingWithStatus;
  } catch (error) {
    console.error("Error fetching following:", error);
    return [];
  }
}
