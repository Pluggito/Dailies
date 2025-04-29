"use client"

import { BellIcon, HomeIcon, LogOutIcon, MenuIcon, UserIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { useState, useEffect } from "react"
import { SignInButton, SignOutButton, useUser, useAuth } from "@clerk/nextjs"
import ModeToggle from "./ModeToggle"
import { useRouter, usePathname } from "next/navigation"
import Loader from "./Loader"

const MobileNavbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  // Reset loading state when pathname changes (navigation completes)
  useEffect(() => {
    setIsLoading(false)
  }, [pathname])

  const getProfileLink = () => {
    if (!user) return "/profile"

    const username = user.username
    const emailPrefix = user.emailAddresses?.[0]?.emailAddress.split("@")[0]
    return `/profile/${username ?? emailPrefix ?? "user"}`
  }

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsLoading(true)
    setShowMobileMenu(false)
    router.push(path)
  }

  return (
    <>
      {isLoading && <Loader/>}

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
            <nav className="flex flex-col space-y-4 mt-6">
              <Button
                variant={"ghost"}
                className="flex items-center gap-3 justify-start"
                onClick={() => handleNavigation("/")}
              >
                <HomeIcon className="w-4 h-4" />
                Home
              </Button>

              {isSignedIn ? (
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
                    onClick={() => handleNavigation(getProfileLink())}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Button>

                  <SignOutButton>
                    <Button
                      variant={"ghost"}
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
                  <Button variant={"default"} className="w-full" onClick={() => setShowMobileMenu(false)}>
                    Sign In
                  </Button>
                </SignInButton>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

export default MobileNavbar
