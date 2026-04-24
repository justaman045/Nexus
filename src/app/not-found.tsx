"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";

export default function NotFound() {
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
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50">Error 404</p>
          <h1 className="text-display gradient-text leading-none">Page not found.</h1>
          <p className="text-body-large text-muted-foreground max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-pro btn-pro-primary px-8 py-3 flex items-center gap-2">
            <ArrowLeft size={15} weight="bold" /> Back to Home
          </Link>
          <Link href="/products" className="btn-pro btn-pro-secondary px-8 py-3">
            Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
