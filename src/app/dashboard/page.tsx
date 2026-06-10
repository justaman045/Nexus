"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { motion } from "framer-motion";
import {
  Download, BookOpen, SignOut, CircleNotch, Package, ArrowSquareOut,
  Copy, Check, GoogleLogo, Vault, ArrowRight, Envelope, Receipt, Play,
  Clock, Key, Cube, Tag,
} from "@phosphor-icons/react";
import { getLicensesByEmail, License } from "@/lib/licenses";
import { getProductById, Product } from "@/lib/products";
import { getHomepageContent } from "@/lib/cms";
import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

type LicenseWithProduct = License & { product?: Product | null };

const ease = [0.16, 1, 0.3, 1] as const;

function timeAgo(ts: License["createdAt"]): string {
  try {
    const d = ts && typeof (ts as { toDate?: () => Date }).toDate === "function"
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as unknown as string);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch { return "—"; }
}

function formatDate(ts: License["createdAt"]) {
  try {
    const d = ts && typeof (ts as { toDate?: () => Date }).toDate === "function"
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as unknown as string);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "—"; }
}

function oldestDate(licenses: LicenseWithProduct[]): string {
  let oldest = Infinity;
  for (const l of licenses) {
    try {
      const d = l.createdAt && typeof (l.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (l.createdAt as { toDate: () => Date }).toDate()
        : new Date(l.createdAt as unknown as string);
      if (d.getTime() < oldest) oldest = d.getTime();
    } catch {}
  }
  if (oldest === Infinity) return "—";
  return new Date(oldest).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CustomerDashboard() {
  const siteSettings = useSiteSettings();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<LicenseWithProduct[]>([]);
  const [isFetchingLicenses, setIsFetchingLicenses] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState("hello@nexus.com");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u?.email) await fetchUserLicenses(u.email);
      setLoading(false);
    });
    getHomepageContent().then((c) => {
      const email = c?.contact?.emails?.[0];
      if (email) setSupportEmail(email);
    });
    return () => unsubscribe();
  }, []);

  async function fetchUserLicenses(email: string) {
    setIsFetchingLicenses(true);
    try {
      const userLicenses = await getLicensesByEmail(email);
      const withProducts = await Promise.all(
        userLicenses.map(async (l) => ({ ...l, product: await getProductById(l.productId) }))
      );
      setLicenses(withProducts);
    } finally {
      setIsFetchingLicenses(false);
    }
  }

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
  };

  const handleLogout = async () => { await signOut(auth); setLicenses([]); };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const uniqueProductCount = useMemo(
    () => new Set(licenses.map((l) => l.productId)).size,
    [licenses]
  );

  const hasDownloads = useMemo(
    () => licenses.some((l) => l.product?.downloadUrl),
    [licenses]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/30 to-purple-500/30 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 blur-xl" />
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full p-12 sm:p-20 rounded-[3rem] apple-card text-center space-y-12 relative"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-border">
              <Vault size={40} weight="thin" className="text-foreground" />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/5 to-purple-500/5 rounded-[3rem] blur-2xl -z-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tighter text-foreground leading-none">{siteSettings.dashboard.vaultHeading}</h1>
            <p className="text-muted-foreground text-xl font-medium leading-relaxed tracking-tight">
              {siteSettings.dashboard.vaultDescription}
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="btn-apple btn-apple-primary w-full py-6 text-[13px] tracking-wide flex items-center justify-center gap-3"
          >
            <GoogleLogo size={20} weight="bold" /> Sign in with Google
          </button>
          <p className="text-label tracking-[0.4em] opacity-50">{siteSettings.dashboard.sslBadge}</p>
        </motion.div>
      </div>
    );
  }

  const avatarInitial = user.displayName?.[0] || user.email?.[0] || "U";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container-pro section-padding pt-0">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 pt-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-16 h-16 rounded-full border-2 border-border relative" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/15 to-purple-500/15 border border-accent/20 flex items-center justify-center text-accent text-2xl font-bold relative">
                  {avatarInitial.toUpperCase()}
                </div>
              )}
              <div className="absolute -inset-1 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-full blur-xl -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold tracking-tight leading-none">{siteSettings.dashboard.libraryHeading}</h1>
                {!isFetchingLicenses && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/[0.08] text-accent border border-accent/[0.15]">
                    {licenses.length} {licenses.length === 1 ? "license" : "licenses"}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-[15px] mt-1">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <SignOut size={16} weight="bold" /> {siteSettings.dashboard.signOutLabel}
          </button>
        </div>

        {/* ── Stats Bar ── */}
        {!isFetchingLicenses && licenses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
          >
            {[
              { label: "Licenses", value: licenses.length, icon: Key },
              { label: "Products", value: uniqueProductCount, icon: Cube },
              { label: "Member since", value: oldestDate(licenses), icon: Clock },
              { label: "Latest", value: timeAgo(licenses[0]?.createdAt), icon: Tag },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-foreground/[0.03] dark:bg-white/[0.04] border border-border p-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/[0.08] border border-accent/[0.12] flex items-center justify-center shrink-0">
                  <stat.icon size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-[22px] font-bold tracking-tight leading-none gradient-text">
                    {typeof stat.value === "number" ? stat.value : stat.value}
                  </p>
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Quick Actions ── */}
        {!isFetchingLicenses && licenses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="flex flex-wrap items-center gap-2 mb-10"
          >
            {hasDownloads && (
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-foreground/[0.04] text-muted-foreground border border-border flex items-center gap-1.5">
                <Download size={12} /> {siteSettings.dashboard.downloadsReady}
              </span>
            )}
            <Link
              href="/orders"
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-foreground/[0.04] text-muted-foreground border border-border flex items-center gap-1.5 hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <Receipt size={12} /> View Orders
            </Link>
            <Link
              href="/contact"
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-foreground/[0.04] text-muted-foreground border border-border flex items-center gap-1.5 hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <Envelope size={12} /> Support
            </Link>
          </motion.div>
        )}

        {/* ── License Grid ── */}
        {isFetchingLicenses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="flex">
                  <div className="w-1 bg-muted shrink-0" />
                  <div className="flex-1 p-6 space-y-5">
                    <div className="flex gap-4 items-start">
                      <div className="w-14 h-14 rounded-2xl bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-40 bg-muted rounded-lg" />
                        <div className="h-3.5 w-24 bg-muted rounded-lg" />
                      </div>
                    </div>
                    <div className="h-10 w-full bg-muted rounded-xl" />
                    <div className="h-10 w-full bg-muted rounded-xl" />
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 bg-muted rounded-full" />
                      <div className="h-8 flex-1 bg-muted rounded-full" />
                      <div className="h-8 flex-1 bg-muted rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : licenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {licenses.map((license, i) => (
              <motion.div
                key={license.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.8, ease }}
                className="rounded-2xl border border-border overflow-hidden flex flex-col relative group"
                style={{
                  background: "hsla(var(--card) / 0.6)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                }}
                onMouseEnter={() => setRevealedKey(license.id || null)}
                onMouseLeave={() => setRevealedKey(null)}
              >
                {/* Gradient Accent Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent via-purple-500 to-accent/30 opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Product Image Watermark */}
                {license.product?.imageUrl && (
                  <div
                    className="absolute -right-8 -top-8 w-32 h-32 opacity-[0.04] dark:opacity-[0.06] bg-contain bg-no-repeat bg-right-top pointer-events-none"
                    style={{ backgroundImage: `url(${license.product.imageUrl})` }}
                  />
                )}

                {/* Card Header */}
                <div className="p-6 flex items-start gap-4 border-b border-border relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-accent/[0.08] border border-accent/[0.12] flex items-center justify-center shrink-0 overflow-hidden">
                    {license.product?.imageUrl ? (
                      <img src={license.product.imageUrl} alt={license.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} weight="regular" className="text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[17px] font-bold tracking-tight leading-tight">{license.productName}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400/80 border border-emerald-500/[0.15] shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {license.product?.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground border border-border">
                          {license.product.category}
                        </span>
                      )}
                      {license.product?.version && (
                        <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                          v{license.product.version}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5 flex-1 relative z-10">
                  {/* License Key */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">License Key</p>
                    <div
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                        revealedKey === license.id
                          ? "bg-accent/[0.04] border-accent/20"
                          : "bg-secondary/50 border-border"
                      }`}
                    >
                      <Key size={14} className={`shrink-0 transition-colors ${revealedKey === license.id ? "text-accent" : "text-muted-foreground/40"}`} />
                      <code className={`text-[12px] font-mono flex-1 break-all tracking-widest transition-all ${
                        revealedKey === license.id ? "text-foreground" : "text-muted-foreground/30 select-none"
                      }`}>
                        {revealedKey === license.id ? license.licenseKey : license.licenseKey.replace(/[^\-]/g, "•")}
                      </code>
                      <button
                        onClick={() => copyKey(license.licenseKey)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        {copiedKey === license.licenseKey
                          ? <Check size={16} weight="bold" className="text-emerald-500" />
                          : <Copy size={16} weight="bold" />}
                      </button>
                    </div>
                  </div>

                  {/* Meta Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Clock size={12} />
                      <span>Licensed <span className="text-foreground/70 font-medium">{formatDate(license.createdAt)}</span></span>
                    </div>
                    <div className="text-[12px] font-mono text-muted-foreground/50" title={license.orderId}>
                      #{license.orderId?.slice(0, 8)}…
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6 grid grid-cols-3 gap-2 relative z-10">
                  {license.product?.downloadUrl ? (
                    <Link href={license.product.downloadUrl} target="_blank" className="btn-pro btn-pro-accent col-span-1 py-2.5 text-[12px] flex items-center justify-center gap-1.5">
                      <Download size={14} weight="bold" /> Download
                    </Link>
                  ) : (
                    <button disabled className="col-span-1 py-2.5 text-[12px] rounded-full bg-muted text-muted-foreground/40 cursor-not-allowed">
                      Download
                    </button>
                  )}
                  {license.product?.documentationUrl ? (
                    <Link href={license.product.documentationUrl} target="_blank" className="btn-pro btn-pro-secondary col-span-1 py-2.5 text-[12px] flex items-center justify-center gap-1.5">
                      <BookOpen size={14} weight="bold" /> Docs
                    </Link>
                  ) : (
                    <Link href={`/products/${license.productId}`} className="btn-pro btn-pro-secondary col-span-1 py-2.5 text-[12px] flex items-center justify-center gap-1.5">
                      <ArrowSquareOut size={14} weight="bold" /> View
                    </Link>
                  )}
                  {license.product?.demoUrl ? (
                    <Link href={license.product.demoUrl} target="_blank" className="btn-pro col-span-1 py-2.5 text-[12px] flex items-center justify-center gap-1.5 border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors">
                      <Play size={14} weight="bold" /> Demo
                    </Link>
                  ) : (
                    <Link href="/contact" className="btn-pro col-span-1 py-2.5 text-[12px] flex items-center justify-center gap-1.5 border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors">
                      <Envelope size={14} weight="bold" /> Help
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-border relative overflow-hidden py-32 px-12 text-center"
            style={{
              background: "hsla(var(--card) / 0.6)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px]" />
            </div>
            <div className="relative space-y-10">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-accent/8 to-purple-500/8 rounded-[2rem] flex items-center justify-center mx-auto border border-border">
                  <Vault size={40} weight="thin" className="text-foreground/40" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-br from-accent/5 to-purple-500/5 rounded-[3rem] blur-2xl -z-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-bold tracking-tighter text-foreground leading-none">{siteSettings.dashboard.emptyHeading}</h2>
                <p className="text-muted-foreground max-w-md mx-auto font-medium leading-relaxed text-lg">
                  {siteSettings.dashboard.emptyDescription.replace("{email}", user.email)}
                </p>
              </div>
              <Link href="/products" className="btn-apple btn-apple-primary inline-flex px-12 py-5 text-[14px]">
                Browse Products <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Support Callout */}
        {!isFetchingLicenses && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease }}
            className="mt-12 rounded-2xl border border-border overflow-hidden"
            style={{
              background: "hsla(var(--card) / 0.6)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-foreground/[0.04] border border-border flex items-center justify-center">
                  <Envelope size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold">Need help?</p>
                  <p className="text-[13px] text-muted-foreground">Reach our team at <span className="text-foreground font-medium">{supportEmail}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/orders" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Receipt size={14} /> Track Order
                </Link>
                <Link href="/contact" className="btn-pro btn-pro-secondary text-[13px] py-2 px-5">
                  Contact Support
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
