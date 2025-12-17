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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <LayoutWrapper sidemenu={sidemenu}>{children}</LayoutWrapper>
        </div>
      </main>
    </div>
  );
}
