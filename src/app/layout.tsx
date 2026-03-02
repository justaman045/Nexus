import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper"; // We'll create this or handle client logic
import FooterWrapper from "@/components/FooterWrapper"; // We'll create this or handle client logic

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus | Premium Software Solutions",
  description: "Discover the best software tools for your workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col relative overflow-x-hidden`}>
        <div className="fixed inset-0 z-[-1]">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[100px] animate-spin-slow opacity-50" />
        </div>

        <NavbarWrapper />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <FooterWrapper />
      </body>
    </html>
  );
}
