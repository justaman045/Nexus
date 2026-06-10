"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, List, X } from "@phosphor-icons/react";
import { ThemeToggle } from "./ThemeToggle";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function Navbar() {
  const siteSettings = useSiteSettings();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 apple-glass ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <div className="container-pro flex items-center justify-between px-6 sm:px-8 lg:px-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center transition-transform group-hover:scale-95">
              <Rocket size={16} weight="fill" className="text-background" />
            </div>
            <span className="font-bold text-[17px] tracking-[-0.03em] text-foreground">
              {siteSettings.brandName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {siteSettings.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-foreground/[0.07] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href={siteSettings.navCta.href} className="btn-pro btn-pro-accent text-[13px] py-2.5 px-5">
              {siteSettings.navCta.label}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center text-foreground"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-2 px-8 pt-28 pb-12">
              {siteSettings.navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    className={`block text-[32px] font-bold tracking-tight py-2 transition-colors ${
                      pathname === link.href
                        ? "text-accent"
                        : "text-foreground hover:text-accent"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mt-8"
              >
                <Link href={siteSettings.navCta.href} className="btn-apple btn-apple-primary w-full justify-center">
                  {siteSettings.navCta.label}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
