"use client";

import { Button } from "./ui/button";
import Link from "next/link";
import {
  BellIcon,
  HomeIcon,
  UserIcon,
  MessageCircle,
  LogOut,
} from "lucide-react";
import ModeToggle from "./ModeToggle";
import { useUser, useAuth } from "./AuthProvider";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const DesktopNavbar = () => {
  const { user, isSignedIn } = useUser();
  const { logout } = useAuth();

  return (
    <div className="hidden md:flex items-center space-x-4 ">
      <ModeToggle />

      <Button variant={"ghost"} className="flex items-center gap-2 " asChild>
        <Link href="/">
          <HomeIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      {isSignedIn && user ? (
        <>
          <Button variant={"ghost"} className="flex items-center gap-2" asChild>
            <Link href="/notifications">
              <BellIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Notifications</span>
            </Link>
          </Button>
          <Button variant={"ghost"} className="flex items-center gap-2" asChild>
            <Link href="/chat">
              <MessageCircle className="w-4 h-4" />
              Messages
            </Link>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || user.username}
                  />
                  <AvatarFallback>
                    {(user.name || user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">
                  {user.name || user.username}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.username}`}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <Button variant={"default"} asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      )}
    </div>
  );
};

export default DesktopNavbar;
