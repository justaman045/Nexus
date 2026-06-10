"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
  <div className="space-y-16">
    <div className="space-y-4">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
        Cookie <span className="text-gray-500">Policy</span>
      </h1>
      <p className="text-gray-500 text-lg font-medium">Last updated: April 2026</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section className="bg-foreground/[0.01] p-10 rounded-[40px] border border-foreground/[0.05] space-y-4 md:col-span-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">What are cookies?</h2>
        <p className="text-gray-400 leading-relaxed font-medium">
          Cookies are small text files that are placed on your computer or mobile device when you browse websites. Our Site may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information.
        </p>
      </section>

      <section className="bg-foreground/[0.01] p-10 rounded-[40px] border border-foreground/[0.05] space-y-4 md:col-span-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">How do we use cookies?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
          {[
            { t: "Essential Cookies", d: "Required for the operation of our software suite and cannot be switched off." },
            { t: "Analytics Cookies", d: "Allow us to recognize and count the number of visitors and see how they move around the Site." },
            { t: "Functionality Cookies", d: "Used to recognize you when you return to our Site and personalize content." }
          ].map((item) => (
            <div key={item.t} className="space-y-2">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">{item.t}</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-foreground/[0.01] p-10 rounded-[40px] border border-foreground/[0.05] space-y-4 md:col-span-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Managing Cookies</h2>
        <p className="text-gray-400 leading-relaxed font-medium">
          Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Site.
        </p>
        <address className="not-italic text-gray-500 text-sm font-bold uppercase tracking-[0.2em] pt-4">
          Nexus Corporation Inc.<br />
          Data Protection Office
        </address>
      </section>
    </div>
  </div>
);

export default function CookiesPage() {
  const siteSettings = useSiteSettings();
  const content = siteSettings.legalPages.cookies;

  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8 relative selection:bg-blue-500/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/[0.01] blur-[150px] rounded-full pointer-events-none" />

      <div className="container-pro section-padding pt-0">
        <nav className="mb-12 pt-10">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-foreground transition-all group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
