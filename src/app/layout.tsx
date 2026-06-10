import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import FooterWrapper from "@/components/FooterWrapper";
import ContentWrapper from "@/components/ContentWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: {
    template: "%s | Nexus",
    default: "Nexus — Premium Software Suite",
  },
  description: "High-performance software tools built in-house and sold exclusively at Nexus. Engineered for creators, developers, and visionaries.",
  metadataBase: new URL("https://nexusprods.vercel.app"),
  openGraph: {
    title: "Nexus — Premium Software Suite",
    description: "High-performance software tools built in-house and sold exclusively at Nexus.",
    url: "https://nexusprods.vercel.app",
    siteName: "Nexus",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — Premium Software Suite",
    description: "High-performance software tools built in-house and sold exclusively at Nexus.",
    creator: "@nexus",
  },
  robots: { index: true, follow: true },
  keywords: ["software", "developer tools", "saas", "nexus", "premium software", "license", "productivity"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col relative overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider>
            <SiteSettingsProvider>
              <NavbarWrapper />
              <ContentWrapper>
                {children}
              </ContentWrapper>
              <FooterWrapper />
              <CookieBanner />
            </SiteSettingsProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
