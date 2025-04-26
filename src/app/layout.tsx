import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

// Importing the font and setting the variable to use globally
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dailies",
  description: "Social Media App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
        >
          <div className="min-h-screen">
            <Navbar />

            <main className="py-8">
              {/* container to center component */}
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="hidden lg:block lg:col-span-3">Sidebar</div>
                  <div className="lg:col-span-9">{children}</div>
                </div>
              </div>
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
