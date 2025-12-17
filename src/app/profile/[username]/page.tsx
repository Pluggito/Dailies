import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

export default async function ProfilePageServer({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  try {
    // Wait for the params promise to resolve
    const resolvedParams = await params;

    // Validate username
    if (!resolvedParams.username) {
      notFound();
    }

    // Get user profile
    const user = await getProfileByUsername(resolvedParams.username);

    if (!user) {
      notFound();
    }

    // Fetch all data in parallel
    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
      getUserPosts(user.id),
      getUserLikedPosts(user.id),
      isFollowing(user.id),
    ]);

    return (
      <ProfilePageClient
        user={user}
        posts={posts}
        likedPosts={likedPosts}
        isFollowing={isCurrentUserFollowing}
      />
    );
  } catch (error) {
    console.error("Error loading profile:", error);

    // If it's a "not found" type error, show 404
    if (error instanceof Error && error.message.includes("not found")) {
      notFound();
    }

    // For other errors, throw to trigger error boundary
    throw error;
  }
}
