"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";
import { useUser } from "./AuthProvider";
import { useEffect, useState } from "react";

interface UserData {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  _count: {
    following: number;
    followers: number;
    posts: number;
  };
}

const Sidemenu = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="sticky top-20">
        <Card className="bg-transparent animate-pulse">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="mt-2 h-4 w-24 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return <UnAuthenticatedSidebar />;
  }

  const displayData = userData || {
    username: user.username,
    name: user.name,
    image: user.image,
    bio: null,
    location: null,
    website: null,
    _count: { following: 0, followers: 0, posts: 0 },
  };

  return (
    <div className="sticky top-20">
      <Card className="bg-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Link
              href={`/profile/${displayData.username}`}
              className="flex flex-col items-center justify-center"
            >
              <Avatar className="w-20 h-20 border-2">
                <AvatarImage src={displayData.image || "/avatar.png"} />
              </Avatar>

              <div className="mt-2">
                <h3 className="font-semibold">{displayData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {displayData.username}
                </p>
              </div>
            </Link>

            {displayData.bio && (
              <p className="mt-3 text-sm text-muted-foreground">
                {displayData.bio}
              </p>
            )}

            <div className="w-full">
              <Separator className="my-4" />
              <div className="flex justify-between">
                <div className="text-center">
                  <p className="font-medium">{displayData._count.following}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <Separator orientation="vertical" />
                <div className="text-center">
                  <p className="font-medium">{displayData._count.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>
              <Separator className="my-4" />
            </div>

            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {displayData.location || "No location"}
              </div>
              <div className="flex items-center text-muted-foreground">
                <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                {displayData.website ? (
                  <a
                    href={displayData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {displayData.website}
                  </a>
                ) : (
                  "No website"
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidemenu;

const UnAuthenticatedSidebar = () => {
  return (
    <div className="sticky top-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            Welcome back!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Login to access your profile and connect with others.
          </p>
          <Button className="w-full cursor-pointer" variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button
            className="w-full mt-2 cursor-pointer"
            variant="default"
            asChild
          >
            <Link href="/register">Sign Up</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
