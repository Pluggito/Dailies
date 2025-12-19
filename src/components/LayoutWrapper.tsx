"use client";

import { usePathname } from "next/navigation";

export default function LayoutWrapper({
  children,
  sidemenu,
}: {
  children: React.ReactNode;
  sidemenu: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith("/chat");

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 ${
        isChatPage ? "h-full" : "gap-6"
      }`}
    >
      {!isChatPage && (
        <div className="hidden lg:block lg:col-span-3">{sidemenu}</div>
      )}
      <div className={isChatPage ? "lg:col-span-12 h-full" : "lg:col-span-9"}>
        {children}
      </div>
    </div>
  );
}
