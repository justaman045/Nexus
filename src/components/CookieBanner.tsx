"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function CookieBanner() {
  const siteSettings = useSiteSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_consent")) setVisible(true);
    } catch { /* storage blocked */ }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem("cookie_consent", "accepted"); } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-xl"
        >
          <div className="apple-card px-5 py-4 flex items-center gap-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
            <div className="w-9 h-9 rounded-xl bg-foreground/[0.05] flex items-center justify-center shrink-0">
              <Cookie size={18} className="text-muted-foreground" />
            </div>
            <p className="text-[13px] text-muted-foreground flex-1 leading-relaxed">
              {siteSettings.cookieBanner.message}{" "}
              <Link href="/cookies" className="text-foreground font-semibold hover:underline underline-offset-2">
                {siteSettings.cookieBanner.learnMoreLabel}
              </Link>
            </p>
            <button
              onClick={dismiss}
              className="btn-pro btn-pro-primary text-[12px] py-2 px-4 shrink-0"
            >
              {siteSettings.cookieBanner.acceptLabel}
            </button>
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
