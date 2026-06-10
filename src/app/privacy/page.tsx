"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CaretLeft, ShieldCheck, Fingerprint, Lock } from "@phosphor-icons/react";
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
        Privacy <span className="text-secondary-foreground font-medium">Protocol</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-xl font-medium">Your data integrity is architected into our core systems. Last updated: April 2026</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <section className="glass-card p-12 space-y-6 group">
        <div className="w-14 h-14 bg-foreground/[0.01] border border-foreground/[0.05] rounded-2xl flex items-center justify-center text-foreground/40 group-hover:scale-110 transition-transform duration-700">
          <ShieldCheck size={24} weight="thin" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground tracking-tight leading-none">Philosophy</h2>
          <p className="text-muted-foreground leading-relaxed font-medium text-lg">
            At Nexus, we don&apos;t just &ldquo;protect&rdquo; data; we eliminate the need for excessive collection. Our systems are built on zero-knowledge principles where possible.
          </p>
        </div>
      </section>

      <section className="glass-card p-12 space-y-6 group">
        <div className="w-14 h-14 bg-foreground/[0.01] border border-foreground/[0.05] rounded-2xl flex items-center justify-center text-foreground/40 group-hover:scale-110 transition-transform duration-700">
          <Fingerprint size={24} weight="thin" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground tracking-tight leading-none">Identity</h2>
          <p className="text-muted-foreground leading-relaxed font-medium text-lg">
            We collect strictly what is required to provision your software licenses. This includes identity, transaction, and essential technical telemetry.
          </p>
        </div>
      </section>

      <section className="md:col-span-2 glass-card p-12 md:p-20 space-y-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] scale-[2]">
          <Lock size={200} weight="thin" className="text-foreground" />
        </div>
        <div className="space-y-6 relative z-10">
          <h2 className="text-4xl font-semibold text-foreground tracking-tight leading-none">Information Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { t: "Provisioning", d: "Data used exclusively to generate and manage your unique software access keys." },
              { t: "Optimization", d: "Anonymous technical telemetry helps us refine the assembly-level performance of our suite." },
              { t: "Verification", d: "Securing your account and preventing unauthorized license deployment." }
            ].map((item) => (
              <div key={item.t} className="space-y-3">
                <h4 className="label-premium tracking-[0.4em]">{item.t}</h4>
                <p className="text-muted-foreground text-base font-medium leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="md:col-span-2 py-20 text-center space-y-10">
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold text-foreground tracking-tight leading-none">Contact Protocol</h2>
          <p className="text-secondary-foreground max-w-lg mx-auto font-medium text-lg leading-relaxed">
            Direct inquiries regarding our data handling procedures can be dispatched to our legal collective.
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-foreground text-xl font-bold tracking-tight">legal@nexus.com</div>
          <address className="not-italic text-zinc-700 text-[10px] font-bold uppercase tracking-[0.4em]">
            Nexus Corporation Collective<br />
            123 Innovation Drive, Digital Zone
          </address>
        </div>
      </section>
    </div>
  </div>
);

export default function PrivacyPage() {
  const siteSettings = useSiteSettings();
  const content = siteSettings.legalPages.privacy;

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
