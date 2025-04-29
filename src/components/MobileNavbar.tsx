'use client';

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  UserIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useState } from 'react';
import { SignInButton, SignOutButton, useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import ModeToggle from './ModeToggle';

const MobileNavbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser(); // ✅ use useUser in client components
 

  const getProfileLink = () => {
    if (!user) return 
    const username = user.username;
    const emailPrefix = user.emailAddresses?.[0]?.emailAddress.split('@')[0];
    return `/profile/${username ?? emailPrefix ?? 'user'}`;
  };

  return (
    <div className="flex md:hidden items-center space-x-2">
      <ModeToggle />

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant={'ghost'} size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-6">
            <Button
              variant={'ghost'}
              className="flex items-center gap-3 justify-start"
              asChild
            >
              <Link href="/" onClick={() => setShowMobileMenu(false)}>
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
            </Button>

            {isSignedIn ? (
              <>
                <Button
                  variant={'ghost'}
                  className="flex items-center gap-3 justify-start"
                  asChild
                >
                  <Link
                    href="/notifications"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <BellIcon className="w-4 h-4" />
                    Notifications
                  </Link>
                </Button>

                <Button
                  variant={'ghost'}
                  className="flex items-center gap-3 justify-start"
                  asChild
                >
                  <Link
                    href={getProfileLink()}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                </Button>

                <SignOutButton>
                  <Button
                    variant={'ghost'}
                    className="flex items-center gap-3 justify-start w-full"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton>
                <Button
                  variant={'default'}
                  className="w-full"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Button>
              </SignInButton>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavbar;
