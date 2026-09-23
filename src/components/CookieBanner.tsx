"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const CONSENT_KEY = "cookie_consent";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getConsent(): string {
  try { return window.localStorage.getItem(CONSENT_KEY) ?? ""; } catch { return ""; }
}

// Server + hydration snapshot — stays consistent with what SSR rendered.
function getServerConsent(): string {
  return "";
}

export default function CookieBanner() {
  const siteSettings = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  const consent = useSyncExternalStore(subscribe, getConsent, getServerConsent);
  const visible = !dismissed && consent === "";

  const setConsent = (value: string) => {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch { /* storage blocked */ }
    setDismissed(true);
  };

  const accept = () => setConsent("accepted");
  const decline = () => setConsent("declined");

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
              onClick={accept}
              className="btn-pro btn-pro-primary text-[12px] py-2 px-4 shrink-0"
            >
              {siteSettings.cookieBanner.acceptLabel}
            </button>
            <button
              onClick={decline}
              className="btn-pro btn-pro-secondary text-[12px] py-2 px-4 shrink-0"
            >
              Decline
            </button>
            <button
              onClick={decline}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Decline"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
