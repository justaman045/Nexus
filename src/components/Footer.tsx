"use client";

import Link from "next/link";
import { Rocket } from "@phosphor-icons/react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function Footer() {
  const siteSettings = useSiteSettings();

  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary/20 border-t border-border">
      <div className="container-pro px-6 sm:px-8 lg:px-12 pt-20 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-6">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center transition-transform group-hover:scale-95">
                <Rocket size={16} weight="fill" className="text-background" />
              </div>
              <span className="font-bold text-[17px] tracking-[-0.03em]">{siteSettings.brandName}</span>
            </Link>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[280px]">
              Premium software, built in-house and sold exclusively through {siteSettings.brandName}.
            </p>
          </div>

          {/* Nav columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {siteSettings.footerColumns.map((col) => (
              <div key={col.heading}>
                <p className="text-label mb-5">{col.heading}</p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[13px] text-muted-foreground/60">
            {siteSettings.footerCopyright.replace("{year}", String(year))}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="text-[12px] text-muted-foreground/50 font-medium">{siteSettings.footerStatusText}</span>
            </div>
            <span className="text-[12px] text-muted-foreground/30 font-mono">{siteSettings.footerVersionBadge}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
