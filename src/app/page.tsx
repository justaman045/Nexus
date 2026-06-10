"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  ArrowRight, Globe, ShieldCheck, Cpu, Code,
  Star, Plus, Minus, Rocket, Package, Storefront, Key,
  Sparkle, Check, ArrowUpRight,
} from "@phosphor-icons/react";
import { getHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";
import { getProducts, Product } from "@/lib/products";
import { useCurrency } from "@/components/CurrencyProvider";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const iv = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" } as const,
  transition: { delay, duration: 0.85, ease: EASE },
});

const stepIcons = [Storefront, Key, Package];
const stepColors = [
  { color: "rgba(99,102,241,0.2)", border: "rgba(99,102,241,0.3)", accent: "#818cf8" },
  { color: "rgba(168,85,247,0.2)", border: "rgba(168,85,247,0.3)", accent: "#c084fc" },
  { color: "rgba(236,72,153,0.2)", border: "rgba(236,72,153,0.3)", accent: "#f472b6" },
];

const bentoVisuals = [
  { icon: Code, orb: "rgba(99,102,241,0.15)", iconBg: "rgba(99,102,241,0.2)", iconBorder: "rgba(99,102,241,0.3)", iconColor: "#818cf8" },
  { icon: Globe, orb: "rgba(168,85,247,0.15)", iconBg: "rgba(168,85,247,0.2)", iconBorder: "rgba(168,85,247,0.3)", iconColor: "#c084fc" },
  { icon: ShieldCheck, orb: "rgba(236,72,153,0.15)", iconBg: "rgba(236,72,153,0.2)", iconBorder: "rgba(236,72,153,0.3)", iconColor: "#f472b6" },
  { icon: Cpu, orb: "rgba(168,85,247,0.15)", iconBg: "rgba(168,85,247,0.2)", iconBorder: "rgba(168,85,247,0.3)", iconColor: "#c084fc" },
];

function FAQItem({ q, a, dark }: { q: string; a: string; dark: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-5 text-left gap-4 group">
        <span className="text-[16px] font-semibold text-foreground group-hover:text-accent transition-colors">{q}</span>
        <div className="shrink-0 w-7 h-7 rounded-full bg-foreground/[0.06] flex items-center justify-center">
          {open ? <Minus size={11} weight="bold" className="text-foreground/50" /> : <Plus size={11} weight="bold" className="text-foreground/50" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }} className="overflow-hidden">
            <p className="pb-5 text-[15px] text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const siteSettings = useSiteSettings();
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { format: formatCurrency, currency } = useCurrency();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    Promise.all([getHomepageContent(), getProducts()]).then(([c, p]) => {
      setContent(c);
      setProducts(p.slice(0, 3));
      setIsLoading(false);
    });
  }, []);

  const dark = !mounted ? true : resolvedTheme === "dark";

  /* ── Theme-aware design tokens ── */
  const glass = {
    background: dark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.035)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
    boxShadow: dark
      ? "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
      : "0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
  };

  const t1 = dark ? "rgba(255,255,255,0.93)" : "hsl(0 0% 5%)";
  const t2 = dark ? "rgba(255,255,255,0.55)" : "hsl(0 0% 38%)";
  const t3 = dark ? "rgba(255,255,255,0.35)" : "hsl(0 0% 52%)";
  const t4 = dark ? "rgba(255,255,255,0.22)" : "hsl(0 0% 65%)";
  const gridLine = dark ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
  const gridOpacity = dark ? 0.025 : 0.04;
  const orbOpacity = dark ? 1 : 0.55;

  const hero = content?.hero;
  const stats = content?.stats ?? [];
  const testimonials = content?.testimonials ?? [];
  const faq = content?.faq ?? [];

  return (
    <div className="overflow-x-hidden bg-background">

      {/* ══ HERO ══ */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden px-6 sm:px-8 lg:px-12 pt-24 pb-16">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full" style={{
            background: `radial-gradient(circle, rgba(99,102,241,${0.28 * orbOpacity}) 0%, transparent 65%)`,
            filter: "blur(80px)", animation: "float-mesh 22s ease-in-out infinite alternate",
          }} />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full" style={{
            background: `radial-gradient(circle, rgba(168,85,247,${0.22 * orbOpacity}) 0%, transparent 65%)`,
            filter: "blur(80px)", animation: "float-mesh 18s ease-in-out infinite alternate-reverse",
          }} />
          <div className="absolute -bottom-20 left-1/3 w-[500px] h-[400px] rounded-full" style={{
            background: `radial-gradient(circle, rgba(236,72,153,${0.18 * orbOpacity}) 0%, transparent 65%)`,
            filter: "blur(80px)", animation: "float-mesh 25s ease-in-out infinite alternate",
          }} />
        </div>
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          opacity: gridOpacity,
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative z-10 container-pro w-full grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── LEFT: Text ── */}
          <div className="flex flex-col items-start">

            {/* Badge */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE }}>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 text-[13px] font-semibold" style={{ ...glass, color: t2 }}>
                <Sparkle size={14} weight="fill" style={{ color: "#818cf8" }} />
                {hero?.badge ?? "✨ Next Generation Software"}
                <div className="w-px h-3.5 mx-0.5" style={{ background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
                <span style={{ color: "#818cf8" }}>New drops weekly</span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1 initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.9, ease: EASE }}
              className="text-[clamp(44px,5.5vw,76px)] font-bold leading-[1.0] tracking-[-0.04em] mb-7">
              <span className="gradient-text block">{hero?.headingLine1 ?? "Building the"}</span>
              <span style={{ color: t1 }} className="block">{hero?.headingLine2 ?? "Digital Future"}</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.8, ease: EASE }}
              className="text-[16px] max-w-[440px] leading-relaxed mb-9" style={{ color: t2 }}>
              {hero?.subheading ?? "Discover a suite of premium tools designed to elevate your workflow. From developer utilities to creative powerhouses."}
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.26, duration: 0.7, ease: EASE }}
              className="flex flex-wrap gap-3 items-center mb-10">
              <Link href="/products" className="btn-apple px-7 py-3.5 font-semibold text-[14px] flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "white", boxShadow: "0 8px 32px rgba(99,102,241,0.35)" }}>
                Explore Products <ArrowRight size={15} weight="bold" />
              </Link>
              <Link href="/about" className="btn-apple px-7 py-3.5 text-[14px] font-semibold" style={{ ...glass, color: t2 }}>
                Learn more
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.8, ease: EASE }}
              className="flex flex-wrap gap-2.5">
              {siteSettings.heroDecorStats.map((s, i) => {
                const dots = ["#6366f1", "#22c55e", "#a855f7", "#f472b6", "#f59e0b"];
                return (
                  <div key={s.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px]" style={glass}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dots[i % dots.length] }} />
                    <span className="font-bold" style={{ color: t1 }}>{s.value}</span>
                    <span style={{ color: t3 }}>{s.label}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* ── RIGHT: Visual ── */}
          <motion.div initial={{ opacity: 0, x: 40, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 1.1, ease: EASE }}
            className="relative hidden lg:block">

            {/* Glow behind card */}
            <div className="absolute -inset-8 rounded-[40px]" style={{
              background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)",
              filter: "blur(30px)",
            }} />

            {/* Browser mockup */}
            <div className="relative rounded-[20px] overflow-hidden" style={glass}>
              {/* Toolbar */}
              <div className="h-9 flex items-center px-4 gap-2 border-b" style={{
                borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                <div className="flex-1 mx-6">
                  <div className="max-w-[180px] mx-auto h-5 rounded-md flex items-center justify-center px-3"
                    style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="text-[10px] font-medium" style={{ color: t4 }}>nexusprods.vercel.app</span>
                  </div>
                </div>
              </div>
              {/* Screen */}
              <div className="aspect-[4/3] relative overflow-hidden" style={{
                background: dark
                  ? "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 50%, rgba(236,72,153,0.05) 100%)"
                  : "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.04) 50%, rgba(236,72,153,0.03) 100%)",
              }}>
                <div className="absolute inset-0" style={{
                  opacity: 0.04,
                  backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }} />
                <div className="absolute top-5 left-5 px-4 py-2.5 rounded-xl text-[11px] font-semibold animate-float" style={{ ...glass, color: t2, animationDelay: "0s" }}>
                  ✦ New product dropped
                </div>
                <div className="absolute top-5 right-5 px-4 py-2.5 rounded-xl text-[11px] font-semibold animate-float" style={{ ...glass, color: t2, animationDelay: "1.2s" }}>
                  💳 Payment secured
                </div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl text-[11px] font-semibold animate-float flex items-center gap-2" style={{ ...glass, color: t2, animationDelay: "0.6s" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  License delivered instantly
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <Rocket size={28} weight="fill" style={{ color: "rgba(255,255,255,0.65)" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating metric cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
              className="absolute -bottom-6 -left-8 px-5 py-3 rounded-2xl text-[12px] font-semibold animate-float"
              style={{ ...glass, color: t1, animationDelay: "0.4s" }}
            >
              <div className="text-[20px] font-bold font-mono gradient-text">10k+</div>
              <div style={{ color: t3 }}>Happy customers</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: EASE }}
              className="absolute -top-6 -right-6 px-4 py-3 rounded-2xl text-[12px] font-semibold animate-float flex items-center gap-3"
              style={{ ...glass, color: t1, animationDelay: "1.8s" }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                <ShieldCheck size={16} weight="fill" style={{ color: "#22c55e" }} />
              </div>
              <div>
                <div className="font-bold text-[13px]">99.9% Uptime</div>
                <div className="text-[11px]" style={{ color: t3 }}>All systems go</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ TRUST STRIP ══ */}
      <section className="border-y py-4 px-6 overflow-hidden" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)", background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-2">
          {siteSettings.trustStrip.map((t, i) => (
            <span key={i} className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: t4 }}>
              <Check size={11} weight="bold" style={{ color: "#6366f1" }} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ══ STATS ══ */}
      {stats.length > 0 && (
        <section className="py-20 px-6 sm:px-8 lg:px-12">
          <div className="container-pro grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div key={i} {...iv(i * 0.08)} className="rounded-2xl p-6 text-center" style={glass}>
                <div className="stat-value gradient-text">{stat.value}</div>
                <div className="text-label mt-2" style={{ color: t3 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ══ BENTO GRID ══ */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)", filter: "blur(60px)", opacity: orbOpacity }} />
        <div className="container-pro relative z-10">
          <motion.div {...iv()} className="text-center mb-14">
            <p className="text-label mb-4">{siteSettings.bentoGrid.heading}</p>
            <h2 className="text-display gradient-text">{siteSettings.bentoGrid.subheading}</h2>
            <p className="text-[16px] mt-5 max-w-[460px] mx-auto leading-relaxed text-muted-foreground">
              {siteSettings.bentoGrid.description}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[240px]">
            {siteSettings.bentoGrid.features.map((f, i) => {
              const v = bentoVisuals[i % bentoVisuals.length];
              const spanClass = i === 0 || i === siteSettings.bentoGrid.features.length - 1 ? "md:col-span-2" : "";
              const isGradient = i === 1;
              return isGradient ? (
                <motion.div key={i} {...iv(0.08)} className={`rounded-2xl p-8 flex flex-col justify-between group cursor-default relative overflow-hidden ${spanClass}`}
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.35) 100%)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 40px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                  <Globe size={72} weight="thin" className="absolute -right-4 -top-2" style={{ color: "rgba(255,255,255,0.12)" }} />
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <v.icon size={20} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-bold tracking-tight mb-2 text-white">{f.title}</h3>
                    <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{f.description}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={i} {...iv(i * 0.08)} className={`rounded-2xl p-8 flex flex-col justify-between group cursor-default relative overflow-hidden ${spanClass}`} style={glass}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at ${i === 0 ? "30% 50%" : i === 2 ? "center" : "70% 50%"}, ${v.orb} 0%, transparent 70%)` }} />
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center relative z-10" style={{ background: v.iconBg, border: `1px solid ${v.iconBorder}` }}>
                    <v.icon size={20} weight="fill" style={{ color: v.iconColor }} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[20px] font-bold tracking-tight mb-2 text-foreground">{f.title}</h3>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">{f.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS ══ */}
      <section className="py-24 px-6 sm:px-8 lg:px-12">
        <div className="container-pro">
          <motion.div {...iv()} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-12">
            <div>
              <p className="text-label mb-3">{siteSettings.productSectionHeadings.heading}</p>
              <h2 className="text-display gradient-text">{siteSettings.productSectionHeadings.subheading}</h2>
              <p className="text-[16px] mt-3 text-muted-foreground">{siteSettings.productSectionHeadings.description}</p>
            </div>
            <Link href="/products" className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full shrink-0" style={{ ...glass, color: t2 }}>
              View all <ArrowUpRight size={13} weight="bold" />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden" style={glass}>
                  <div className="aspect-[16/9] animate-pulse bg-foreground/[0.05]" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 w-2/3 rounded-lg animate-pulse bg-foreground/[0.06]" />
                    <div className="h-3 w-1/2 rounded-lg animate-pulse bg-foreground/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} weight="thin" className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-[16px] text-muted-foreground">No products yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, i) => (
                <motion.div key={product.id} {...iv(i * 0.07)}>
                  <Link href={`/products/${product.id}`}>
                    <div className="rounded-2xl overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform duration-500" style={glass}>
                      <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                        {product.imageUrl
                          ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                          : <div className="w-full h-full flex items-center justify-center bg-foreground/[0.03]">
                              <Package size={40} weight="thin" className="text-muted-foreground/30" />
                            </div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {product.category}
                        </span>
                      </div>
                      <div className="p-5 flex justify-between items-center">
                        <div>
                          <h3 className="text-[16px] font-bold tracking-tight text-foreground">{product.name}</h3>
                          <p className="text-[13px] mt-0.5 line-clamp-1 text-muted-foreground">{product.description}</p>
                        </div>
                        <span className="text-[18px] font-bold font-mono gradient-text shrink-0 ml-3">{formatCurrency(product.price)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: orbOpacity * 0.5, background: "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.15) 0%, transparent 65%)", filter: "blur(40px)" }} />
        <div className="container-pro relative z-10">
          <motion.div {...iv()} className="text-center mb-14">
            <p className="text-label mb-3">{siteSettings.howItWorks.heading}</p>
            <h2 className="text-display gradient-text">{siteSettings.howItWorks.subheading}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {siteSettings.howItWorks.steps.map((step, i) => {
              const Icon = stepIcons[i % stepIcons.length];
              const sc = stepColors[i % stepColors.length];
              const num = String(i + 1).padStart(2, "0");
              return (
                <motion.div key={num} {...iv(i * 0.1)} className="rounded-2xl p-8 flex flex-col gap-7 relative overflow-hidden group" style={glass}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 30% 30%, ${sc.color} 0%, transparent 70%)` }} />
                  <div className="flex items-start justify-between relative z-10">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: sc.color, border: `1px solid ${sc.border}` }}>
                      <Icon size={20} weight="fill" style={{ color: sc.accent }} />
                    </div>
                    <span className="font-mono text-[26px] font-bold text-foreground/[0.06]">{num}</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[18px] font-bold tracking-tight mb-2 text-foreground">{step.title}</h3>
                    <p className="text-[14px] leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      {testimonials.length > 0 && (
        <section className="py-24 px-6 sm:px-8 lg:px-12">
          <div className="container-pro">
            <motion.div {...iv()} className="text-center mb-14">
              <p className="text-label mb-3">{siteSettings.sectionHeadings.testimonials.heading}</p>
              <h2 className="text-display gradient-text">{siteSettings.sectionHeadings.testimonials.subheading}</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.slice(0, 3).map((t, i) => (
                <motion.div key={i} {...iv(i * 0.1)} className="rounded-2xl p-7 flex flex-col gap-5" style={glass}>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={13} weight="fill" style={{ color: "#818cf8" }} />)}
                  </div>
                  <p className="text-[15px] font-medium leading-relaxed flex-1 text-foreground/80">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.7), rgba(168,85,247,0.6))" }}>
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{t.author}</p>
                      <p className="text-[12px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FAQ ══ */}
      {faq.length > 0 && (
        <section className="py-24 px-6 sm:px-8 lg:px-12">
          <div className="container-pro max-w-[720px]">
            <motion.div {...iv()} className="text-center mb-12">
              <p className="text-label mb-3">{siteSettings.sectionHeadings.faq.heading}</p>
              <h2 className="text-display gradient-text">{siteSettings.sectionHeadings.faq.subheading}</h2>
            </motion.div>
            <motion.div {...iv()} className="rounded-2xl p-8" style={glass}>
              {faq.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} dark={dark} />)}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══ FINAL CTA ══ */}
      <section className="py-24 px-6 sm:px-10 pb-32">
        <motion.div {...iv()} className="rounded-[32px] p-16 sm:p-24 text-center relative overflow-hidden"
          style={{
            background: dark
              ? "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.2) 50%, rgba(236,72,153,0.18) 100%)"
              : "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.1) 50%, rgba(236,72,153,0.08) 100%)",
            border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(99,102,241,0.2)",
            backdropFilter: "blur(24px)",
            boxShadow: dark
              ? "0 32px 80px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.15)"
              : "0 32px 80px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}>
          <div className="absolute top-0 left-1/4 w-[300px] h-[200px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, transparent 70%)", filter: "blur(40px)", opacity: orbOpacity * 0.8 }} />
          <div className="absolute bottom-0 right-1/4 w-[250px] h-[180px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.25) 0%, transparent 70%)", filter: "blur(40px)", opacity: orbOpacity * 0.8 }} />
          <div className="relative z-10">
            <p className="text-label mb-5">{siteSettings.finalCta.heading}</p>
            <h2 className="text-display text-foreground">{siteSettings.finalCta.subheading}</h2>
            <p className="text-[16px] mt-6 max-w-[420px] mx-auto leading-relaxed text-muted-foreground">
              {siteSettings.finalCta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-12">
              <Link href="/products" className="btn-apple px-9 py-4 font-semibold text-[14px] flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "white", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
                {siteSettings.finalCta.primaryButton} <ArrowRight size={15} weight="bold" />
              </Link>
              <Link href="/contact" className="btn-apple btn-apple-secondary px-9 py-4 text-[14px]">
                {siteSettings.finalCta.secondaryButton}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
