"use client";

import {
  BellIcon,
  HomeIcon,
  MessageCircle,
  LogOutIcon,
  MenuIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useState, useEffect } from "react";
import { useUser, useAuth } from "./AuthProvider";
import ModeToggle from "./ModeToggle";
import { useRouter, usePathname } from "next/navigation";
import Loader from "./Loader";
import Link from "next/link";

const MobileNavbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isSignedIn } = useUser();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Reset loading state when pathname changes (navigation completes)
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const getProfileLink = () => {
    if (!user) return "/profile";
    return `/profile/${user.username}`;
  };

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setShowMobileMenu(false);
    router.push(path);
  };

  const handleLogout = async () => {
    setShowMobileMenu(false);
    await logout();
  };

  return (
    <>
      {isLoading && <Loader />}

      <div className="flex md:hidden items-center space-x-2">
        <ModeToggle />

        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetTrigger asChild>
            <Button variant={"ghost"} size="icon">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-4 ">
              <Button
                variant={"ghost"}
                className="flex items-center gap-3 justify-start"
                onClick={() => handleNavigation("/")}
              >
                <HomeIcon className="w-4 h-4" />
                Home
              </Button>

              {isSignedIn && user ? (
                <>
                  <Button
                    variant={"ghost"}
                    className="flex items-center gap-3 justify-start"
                    onClick={() => handleNavigation("/notifications")}
                  >
                    <BellIcon className="w-4 h-4" />
                    Notifications
                  </Button>

                  <Button
                    variant={"ghost"}
                    className="flex items-center gap-3 justify-start"
                    onClick={() => handleNavigation("/chat")}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Messages
                  </Button>

                  <Button
                    variant={"ghost"}
                    className="flex items-center gap-3 justify-start"
                    onClick={() => handleNavigation(getProfileLink())}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Button>

                  <Button
                    variant={"ghost"}
                    className="flex items-center gap-3 justify-start w-full text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant={"default"}
                  className="w-full"
                  asChild
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default MobileNavbar;
