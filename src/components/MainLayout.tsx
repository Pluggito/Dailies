"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";

interface MainLayoutProps {
  children: React.ReactNode;
  sidemenu: React.ReactNode;
}

export default function MainLayout({ children, sidemenu }: MainLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  const isChatPage = pathname.startsWith("/chat");

  return (
    <div
      className={
        isChatPage
          ? "h-screen flex flex-col overflow-hidden"
          : "min-h-screen flex flex-col"
      }
    >
      <Navbar />
      <main
        className={isChatPage ? "flex-1 flex flex-col overflow-hidden" : "py-8"}
      >
        <div
          className={
            isChatPage
              ? "w-full flex-1 flex flex-col overflow-hidden"
              : "max-w-7xl mx-auto px-4"
          }
        >
          <LayoutWrapper sidemenu={sidemenu}>{children}</LayoutWrapper>
        </div>
      </main>
    </div>
  );
}
