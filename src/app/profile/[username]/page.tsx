import {
    getProfileByUsername,
    getUserLikedPosts,
    getUserPosts,
    isFollowing,
  } from "@/actions/profile.action";
  import { notFound } from "next/navigation";
  import ProfilePageClient from "./ProfilePageClient";
  
  export default async function ProfilePageServer({ params }: { params: Promise<{ username: string }> }) {
    // Wait for the params promise to resolve
    const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams.username);
  
    if (!user) notFound();
  
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
  }