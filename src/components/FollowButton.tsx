"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { toggleFollow } from "@/actions/user.action";

interface FollowButtonProps {
  userId: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);

    try {
      await toggleFollow(userId);
      toast.success("User followed successfully");
    } catch (error) {
      toast.error("Error following user");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Button
      size={"sm"}
      variant={"secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-20"
      aria-label={isLoading ? "Following..." : "Follow user"}
    >
      {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Follow"}
    </Button>
  );
};

export default FollowButton;
