"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserFollowers, getUserFollowing } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import { useUser } from "@/components/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FollowerUser = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  _count: {
    followers: number;
  };
  isFollowedByCurrentUser: boolean;
};

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  initialTab?: "followers" | "following";
}

export default function FollowersDialog({
  open,
  onOpenChange,
  userId,
  username,
  initialTab = "followers",
}: FollowersDialogProps) {
  const { user: currentUser } = useUser();
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [following, setFollowing] = useState<FollowerUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadFollowers();
      loadFollowing();
    }
  }, [open, userId]);

  const loadFollowers = async () => {
    setLoadingFollowers(true);
    const data = await getUserFollowers(userId);
    setFollowers(data as any[]);
    setLoadingFollowers(false);
  };

  const loadFollowing = async () => {
    setLoadingFollowing(true);
    const data = await getUserFollowing(userId);
    setFollowing(data as any[]);
    setLoadingFollowing(false);
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser) return;

    setUpdatingUsers((prev) => new Set(prev).add(targetUserId));

    try {
      await toggleFollow(targetUserId);

      // Update local state for both lists
      setFollowers((prev) =>
        prev.map((user) =>
          user.id === targetUserId
            ? {
                ...user,
                isFollowedByCurrentUser: !user.isFollowedByCurrentUser,
              }
            : user
        )
      );

      setFollowing((prev) =>
        prev.map((user) =>
          user.id === targetUserId
            ? {
                ...user,
                isFollowedByCurrentUser: !user.isFollowedByCurrentUser,
              }
            : user
        )
      );

      toast.success("Follow status updated");
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Failed to update follow status");
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const UserCard = ({ user }: { user: FollowerUser }) => {
    const isOwnProfile = currentUser?.id === user.id;
    const isUpdating = updatingUsers.has(user.id);

    return (
      <div className="flex items-center justify-between py-3">
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 flex-1 hover:opacity-80"
          onClick={() => onOpenChange(false)}
        >
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={user.image ?? "/avatar.png"}
              alt={`${user.name || user.username}'s avatar`}
            />
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {user.name || user.username}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              @{user.username}
            </p>
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {user.bio}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {user._count.followers} followers
            </p>
          </div>
        </Link>
        {!isOwnProfile && currentUser && (
          <Button
            size="sm"
            variant={user.isFollowedByCurrentUser ? "outline" : "default"}
            onClick={() => handleToggleFollow(user.id)}
            disabled={isUpdating}
            className="ml-2"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : user.isFollowedByCurrentUser ? (
              "Unfollow"
            ) : (
              "Follow"
            )}
          </Button>
        )}
        {!currentUser && (
          <Button size="sm" asChild>
            <Link href="/login">Follow</Link>
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>@{username}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="followers" className="flex-1">
              Followers
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="followers"
            className="mt-4 max-h-[50vh] overflow-y-auto"
          >
            {loadingFollowers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : followers.length > 0 ? (
              <div className="divide-y">
                {followers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No followers yet
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="following"
            className="mt-4 max-h-[50vh] overflow-y-auto"
          >
            {loadingFollowing ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : following.length > 0 ? (
              <div className="divide-y">
                {following.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Not following anyone yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
