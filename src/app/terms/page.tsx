"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-[32px] sm:text-[40px] font-bold text-foreground tracking-tight mt-12 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[24px] font-semibold text-foreground tracking-tight mt-10 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[18px] font-semibold text-foreground mt-8 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2 mb-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] text-muted-foreground leading-relaxed flex items-start gap-2.5 mb-1">
      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground/80">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/80 transition-colors">
      {children}
    </a>
  ),
};

const fallbackContent = (
  <div className="space-y-32">
    <header className="space-y-6">
      <h1 className="text-huge">
        Terms of <span className="text-secondary-foreground font-medium">Service</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-xl font-medium">The legal framework governing your access to the Nexus suite. Last updated: April 2026</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <section className="glass-card p-12 space-y-6">
        <h2 className="text-3xl font-semibold text-foreground tracking-tight">1. Protocol Acceptance</h2>
        <p className="text-muted-foreground leading-relaxed font-medium text-lg">
          By accessing the Nexus suite, you enter into a legally binding protocol with Nexus Corporation. If you do not agree to these terms, you must terminate your session immediately.
        </p>
      </section>

      <section className="glass-card p-12 space-y-6">
        <h2 className="text-3xl font-semibold text-foreground tracking-tight">2. Proprietary Assets</h2>
        <p className="text-muted-foreground leading-relaxed font-medium text-lg">
          All source code, binary distributions, visual assets, and architectural patterns are the exclusive proprietary property of the Nexus collective. Unauthorized reverse engineering is strictly prohibited.
        </p>
      </section>

      <section className="md:col-span-2 glass-card p-12 md:p-20 space-y-12">
        <h2 className="text-4xl font-semibold text-foreground tracking-tight leading-none">3. User Obligations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { t: "Integrity", d: "You represent that you have the legal capacity to authorize this agreement and maintain account security." },
            { t: "Neutrality", d: "The suite must not be utilized for any illegal, unauthorized, or abrasive digital operations." },
            { t: "Compliance", d: "Users must adhere to all local and international data processing and export regulations." }
          ].map((item) => (
            <div key={item.t} className="space-y-3">
              <h4 className="label-premium tracking-[0.4em]">{item.t}</h4>
              <p className="text-muted-foreground text-base font-medium leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="md:col-span-2 glass-card p-12 md:p-20 space-y-8">
        <h2 className="text-4xl font-semibold text-foreground tracking-tight">4. Service Continuity</h2>
        <p className="text-muted-foreground leading-relaxed font-medium text-xl max-w-4xl">
          Nexus reserves the right to modify, optimize, or deprecate assets within the suite at any time to maintain our standard of excellence. We are not liable for session interruptions or price modifications resulting from these necessary evolutions.
        </p>
        <div className="pt-10 border-t border-foreground/[0.02]">
          <address className="not-italic text-zinc-700 text-[10px] font-bold uppercase tracking-[0.4em]">
            Nexus Corporation Legal Department<br />
            Global Headquarters
          </address>
        </div>
      </section>
    </div>
  </div>
);

export default function TermsPage() {
  const siteSettings = useSiteSettings();
  const content = siteSettings.legalPages.terms;

  return (
    <div className="min-h-[100dvh] bg-background selection:bg-foreground/10 overflow-x-hidden">
      <div className="mesh-bg animate-glow-subtle opacity-20" />

      <div className="container-pro section-padding pt-0">
        <nav className="mb-16 pt-10">
          <Link href="/" className="inline-flex items-center gap-3 label-premium tracking-[0.4em] hover:text-foreground transition-all group">
            <CaretLeft size={12} weight="bold" className="group-hover:-translate-x-1 transition-transform" /> Return Home
          </Link>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {content ? (
            <div className="max-w-3xl mx-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
              </ReactMarkdown>
            </div>
          ) : fallbackContent}
        </motion.div>
      </div>
    </div>
  );
}
