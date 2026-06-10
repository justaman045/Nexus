"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Lightning, Lock, ArrowRight, Users, Code, Globe, ShieldCheck } from "@phosphor-icons/react";
import { getHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";
import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" } as const,
  transition: { delay, duration: 0.85, ease: EASE },
});

export default function AboutPage() {
  const siteSettings = useSiteSettings();
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
              <span className="gradient-text">{siteSettings.aboutPage.heroHeading}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16, duration: 0.8, ease: EASE }}
              className="text-[16px] text-muted-foreground leading-relaxed max-w-[420px]"
            >
              {siteSettings.aboutPage.heroSubheading || content.about?.description || ""}
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
              { icon: Globe, color: "from-blue-500/15 to-blue-600/5", border: "border-blue-500/20", text: "text-blue-400" },
              { icon: Code, color: "from-violet-500/15 to-violet-600/5", border: "border-violet-500/20", text: "text-violet-400" },
              { icon: Target, color: "from-pink-500/15 to-pink-600/5", border: "border-pink-500/20", text: "text-pink-400" },
              { icon: ShieldCheck, color: "from-emerald-500/15 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-400" },
            ].map((item, i) => {
              const stat = siteSettings.aboutPage.statCards[i];
              if (!stat) return null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: EASE }}
                  className={`card-pro p-6 bg-gradient-to-br ${item.color} border ${item.border} space-y-3`}
                >
                  <item.icon size={20} weight="fill" className={item.text} />
                  <div>
                    <div className={`text-[28px] font-bold font-mono tracking-tight ${item.text}`}>{stat.value}</div>
                    <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mt-0.5">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
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
              {siteSettings.aboutPage.manifestoQuote}
            </blockquote>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">— {siteSettings.aboutPage.manifestoAttribution}</p>
          </motion.div>
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section className="pb-24 px-6 sm:px-8 lg:px-12">
        <div className="container-pro">
          <motion.div {...inView()} className="mb-12">
            <p className="text-label mb-3">{siteSettings.aboutPage.principlesSectionHeading}</p>
            <h2 className="text-[clamp(32px,4vw,52px)] font-bold tracking-tight gradient-text">{siteSettings.aboutPage.principlesSectionSubheading}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Target, color: "from-blue-500/15", border: "border-blue-500/20", icon_c: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Lightning, color: "from-violet-500/15", border: "border-violet-500/20", icon_c: "text-violet-400", bg: "bg-violet-500/10" },
              { icon: Lock, color: "from-pink-500/15", border: "border-pink-500/20", icon_c: "text-pink-400", bg: "bg-pink-500/10" },
            ].map((item, i) => {
              const principle = siteSettings.aboutPage.principles[i];
              if (!principle) return null;
              return (
                <motion.div key={i} {...inView(i * 0.1)} className={`card-pro p-8 group relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className="relative z-10 space-y-5">
                    <div className={`w-11 h-11 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center`}>
                      <item.icon size={20} weight="fill" className={item.icon_c} />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight mb-2">{principle.title}</h3>
                      <p className="text-[14px] text-muted-foreground leading-relaxed">{principle.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
                <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>{siteSettings.aboutPage.collectiveSectionLabel}</p>
                <h2 className="text-[clamp(30px,3.5vw,48px)] font-bold leading-[1.1] tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
                  {siteSettings.aboutPage.collectiveHeading}
                </h2>
              </div>
              <div className="space-y-4 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {siteSettings.aboutPage.collectiveBody.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>
                  {siteSettings.brandName[0]}
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{siteSettings.aboutPage.teamLabel}</p>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>{siteSettings.aboutPage.teamDate}</p>
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
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight gradient-text">{siteSettings.finalCta.subheading}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {siteSettings.finalCta.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/products" className="btn-apple btn-apple-primary px-7 py-3.5 text-[14px] flex items-center gap-2">
              {siteSettings.finalCta.primaryButton} <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/contact" className="btn-apple btn-apple-secondary px-7 py-3.5 text-[14px]">{siteSettings.finalCta.secondaryButton}</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
