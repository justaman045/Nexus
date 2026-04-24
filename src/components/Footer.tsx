"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Rocket, GithubLogo, TwitterLogo, LinkedinLogo } from "@phosphor-icons/react";
import { getHomepageContent, HomepageContent } from "@/lib/cms";

const navColumns = [
  {
    title: "Product",
    links: [
      { label: "Browse Software", href: "/products" },
      { label: "My Dashboard", href: "/dashboard" },
      { label: "Track Order", href: "/orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  const [content, setContent] = useState<HomepageContent | null>(null);

  useEffect(() => {
    getHomepageContent().then(setContent);
  }, []);

  const year = new Date().getFullYear();
  const description = content?.footer?.description ?? "Premium software, built in-house and sold exclusively through Nexus.";
  const social = content?.footer?.socialLinks ?? { twitter: "#", github: "#", linkedin: "#" };

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
              <span className="font-bold text-[17px] tracking-[-0.03em]">Nexus</span>
            </Link>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[280px]">
              {description}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {social.github && social.github !== "#" && (
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.1] transition-all"
                  aria-label="GitHub"
                >
                  <GithubLogo size={16} weight="fill" />
                </a>
              )}
              {social.twitter && social.twitter !== "#" && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.1] transition-all"
                  aria-label="Twitter"
                >
                  <TwitterLogo size={16} weight="fill" />
                </a>
              )}
              {social.linkedin && social.linkedin !== "#" && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.1] transition-all"
                  aria-label="LinkedIn"
                >
                  <LinkedinLogo size={16} weight="fill" />
                </a>
              )}
            </div>
          </div>

          {/* Nav columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {navColumns.map((col) => (
              <div key={col.title}>
                <p className="text-label mb-5">{col.title}</p>
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
            © {year} Nexus. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="text-[12px] text-muted-foreground/50 font-medium">All systems operational</span>
            </div>
            <span className="text-[12px] text-muted-foreground/30 font-mono">v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
