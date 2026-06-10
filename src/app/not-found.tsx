"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function NotFound() {
  const siteSettings = useSiteSettings();
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg space-y-10"
      >
        <div className="w-20 h-20 rounded-3xl bg-foreground/[0.04] border border-border flex items-center justify-center mx-auto">
          <MagnifyingGlass size={32} weight="thin" className="text-muted-foreground/40" />
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50">{siteSettings.notFound.code}</p>
          <h1 className="text-display gradient-text leading-none">{siteSettings.notFound.heading}</h1>
          <p className="text-body-large text-muted-foreground max-w-sm mx-auto">
            {siteSettings.notFound.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-pro btn-pro-primary px-8 py-3 flex items-center gap-2">
            <ArrowLeft size={15} weight="bold" /> {siteSettings.notFound.backButton}
          </Link>
          <Link href="/products" className="btn-pro btn-pro-secondary px-8 py-3">
            {siteSettings.notFound.browseButton}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
