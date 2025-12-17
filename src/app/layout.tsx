import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidemenu from "@/components/Sidemenu";
import { Toaster } from "@/components/ui/sonner";
import { Pacifico } from "next/font/google";
import { WebSocketInitializer } from "@/components/WebSocketInitializer";
import { AuthProvider } from "@/components/AuthProvider";
import MainLayout from "@/components/MainLayout";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Dailies",
  description: "Social media application powered by next.js",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${pacifico.variable} ${poppins.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <WebSocketInitializer />
            <MainLayout sidemenu={<Sidemenu />}>{children}</MainLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
