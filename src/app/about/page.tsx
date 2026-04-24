"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Lightning, Lock, ArrowRight, Users, Code, Globe, ShieldCheck } from "@phosphor-icons/react";
import { getHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" } as const,
  transition: { delay, duration: 0.85, ease: EASE },
});

export default function AboutPage() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);

  useEffect(() => {
    getHomepageContent().then(d => { if (d) setContent(d); }).catch(() => {});
  }, []);

  const stats = content.stats ?? [];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── HERO: Split layout ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px]"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 65%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px]"
            style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.14) 0%, transparent 65%)", filter: "blur(60px)" }} />
        </div>

        <div className="relative z-10 container-pro px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/60 border border-border text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
              Our Story
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.9, ease: EASE }}
              className="text-[clamp(44px,6vw,80px)] font-bold tracking-[-0.04em] leading-[1.0]"
            >
              <span className="gradient-text">We build</span><br />
              <span className="text-foreground/90">software</span><br />
              <span className="gradient-text">differently.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16, duration: 0.8, ease: EASE }}
              className="text-[16px] text-muted-foreground leading-relaxed max-w-[420px]"
            >
              {content.about?.description || "A collective of engineers and designers committed to building tools for the modern creator — designed with precision, engineered with purpose."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22, duration: 0.7, ease: EASE }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/products" className="btn-apple btn-apple-primary px-7 py-3 text-[14px] flex items-center gap-2">
                Browse Products <ArrowRight size={14} weight="bold" />
              </Link>
              <Link href="/contact" className="btn-apple btn-apple-secondary px-7 py-3 text-[14px]">
                Get in touch
              </Link>
            </motion.div>
          </div>

          {/* Right: Bento cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: EASE }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Stat cards */}
            {[
              { value: "2023", label: "Founded", icon: Globe, color: "from-blue-500/15 to-blue-600/5", border: "border-blue-500/20", text: "text-blue-400" },
              { value: "10+", label: "Products", icon: Code, color: "from-violet-500/15 to-violet-600/5", border: "border-violet-500/20", text: "text-violet-400" },
              { value: "50+", label: "Countries", icon: Target, color: "from-pink-500/15 to-pink-600/5", border: "border-pink-500/20", text: "text-pink-400" },
              { value: "99.9%", label: "Uptime", icon: ShieldCheck, color: "from-emerald-500/15 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-400" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: EASE }}
                className={`card-pro p-6 bg-gradient-to-br ${item.color} border ${item.border} space-y-3`}
              >
                <item.icon size={20} weight="fill" className={item.text} />
                <div>
                  <div className={`text-[28px] font-bold font-mono tracking-tight ${item.text}`}>{item.value}</div>
                  <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mt-0.5">{item.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS FROM CMS ── */}
      {stats.length > 0 && (
        <section className="border-y border-border bg-secondary/10 py-14 px-6">
          <div className="container-pro grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={i} {...inView(i * 0.08)} className="text-center">
                <div className="stat-value gradient-text">{stat.value}</div>
                <div className="text-label mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── MANIFESTO ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div className="container-pro max-w-[760px] text-center relative z-10">
          <motion.div {...inView()}>
            <p className="text-label mb-6">Our belief</p>
            <blockquote className="text-[clamp(20px,2.5vw,26px)] font-semibold text-foreground/80 leading-[1.55] tracking-tight">
              &ldquo;High-performance software doesn&apos;t have to be visually abrasive. Speed and beauty are the same thing — and we exist to prove it.&rdquo;
            </blockquote>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">— Nexus Core Team</p>
          </motion.div>
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section className="pb-24 px-6 sm:px-8 lg:px-12">
        <div className="container-pro">
          <motion.div {...inView()} className="mb-12">
            <p className="text-label mb-3">What drives us</p>
            <h2 className="text-[clamp(32px,4vw,52px)] font-bold tracking-tight gradient-text">Core principles.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: "Precision", desc: "Every pixel, every API, every interaction is deliberate. We build tools that do exactly what they say — nothing more.", color: "from-blue-500/15", border: "border-blue-500/20", icon_c: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Lightning, title: "Speed", desc: "Eliminating latency between thought and execution — at the code level, the UI level, and the business level.", color: "from-violet-500/15", border: "border-violet-500/20", icon_c: "text-violet-400", bg: "bg-violet-500/10" },
              { icon: Lock, title: "Ownership", desc: "We own every line of code we ship. No outsourced quality, no third-party dependencies we don't understand.", color: "from-pink-500/15", border: "border-pink-500/20", icon_c: "text-pink-400", bg: "bg-pink-500/10" },
            ].map((item, i) => (
              <motion.div key={item.title} {...inView(i * 0.1)} className={`card-pro p-8 group relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative z-10 space-y-5">
                  <div className={`w-11 h-11 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center`}>
                    <item.icon size={20} weight="fill" className={item.icon_c} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold tracking-tight mb-2">{item.title}</h3>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE COLLECTIVE ── */}
      <section className="px-6 sm:px-8 lg:px-12 pb-24">
        <motion.div
          {...inView()}
          className="rounded-[32px] overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #0c0c14 0%, #10101a 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="absolute top-0 left-0 w-[400px] h-[300px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)", filter: "blur(50px)" }} />
          <div className="absolute bottom-0 right-0 w-[350px] h-[250px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.14) 0%, transparent 70%)", filter: "blur(50px)" }} />

          <div className="relative z-10 p-10 md:p-16 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-7">
              <div>
                <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>The Collective</p>
                <h2 className="text-[clamp(30px,3.5vw,48px)] font-bold leading-[1.1] tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
                  Built different,<br />by design.
                </h2>
              </div>
              <div className="space-y-4 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                <p>Nexus was founded on a simple realization: high-performance software doesn't have to be visually abrasive.</p>
                <p>We operate as a high-trust collective, prioritizing deep work and architectural integrity over generic growth. Every tool we ship is something we use daily.</p>
                <p>We push the boundaries of what's possible on the web — crafting a digital suite that scales with your ambition.</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>N</div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Nexus Core Team</p>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>Founded 2023</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden">
              {content.about?.imageUrl ? (
                <img src={content.about.imageUrl} alt="The Collective" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Users size={80} weight="thin" style={{ color: "rgba(255,255,255,0.1)" }} />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 55%)" }} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="pb-32 px-6 text-center">
        <motion.div {...inView()} className="space-y-5 max-w-[480px] mx-auto">
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight gradient-text">Ready to build?</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Browse our full suite and find the tool that moves your work forward.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/products" className="btn-apple btn-apple-primary px-7 py-3.5 text-[14px] flex items-center gap-2">
              Explore Products <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/contact" className="btn-apple btn-apple-secondary px-7 py-3.5 text-[14px]">Contact Us</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
