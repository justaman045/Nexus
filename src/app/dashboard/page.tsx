"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { motion } from "framer-motion";
import {
  Download, BookOpen, SignOut, CircleNotch, Package, ArrowSquareOut,
  Copy, Check, GoogleLogo, Vault, ArrowRight, Envelope, Receipt, Play,
} from "@phosphor-icons/react";
import { getLicensesByEmail, License } from "@/lib/licenses";
import { getProductById, Product } from "@/lib/products";
import { getHomepageContent, defaultContent } from "@/lib/cms";
import Link from "next/link";

type LicenseWithProduct = License & { product?: Product | null };

export default function CustomerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<LicenseWithProduct[]>([]);
  const [isFetchingLicenses, setIsFetchingLicenses] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  const formatDate = (ts: License["createdAt"]) => {
    try {
      const d = ts && typeof (ts as { toDate?: () => Date }).toDate === "function"
        ? (ts as { toDate: () => Date }).toDate()
        : new Date(ts as unknown as string);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "—"; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleNotch className="w-10 h-10 text-foreground animate-spin opacity-20" weight="bold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full p-12 sm:p-20 rounded-[3rem] apple-card text-center space-y-12"
        >
          <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto border border-border">
            <Vault size={40} weight="thin" className="text-foreground" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tighter text-foreground leading-none">Your Vault</h1>
            <p className="text-muted-foreground text-xl font-medium leading-relaxed tracking-tight">
              Sign in with your purchase email to access your provisioned software assets.
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="btn-apple btn-apple-primary w-full py-6 text-[13px] tracking-wide flex items-center justify-center gap-3"
          >
            <GoogleLogo size={20} weight="bold" /> Sign in with Google
          </button>
          <p className="text-label tracking-[0.4em] opacity-50">SSL Secured • End-to-End Encrypted</p>
        </motion.div>
      </div>
    );
  }

  const avatarInitial = user.displayName?.[0] || user.email?.[0] || "U";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container-pro section-padding pt-0">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20 pt-10">
          <div className="flex items-center gap-5">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-16 h-16 rounded-full border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent/[0.12] border border-accent/[0.2] flex items-center justify-center text-accent text-2xl font-bold">
                {avatarInitial.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold tracking-tight leading-none">My Library</h1>
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
            <SignOut size={16} weight="bold" /> Sign Out
          </button>
        </div>

        {/* License Grid */}
        {isFetchingLicenses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="card-pro p-8 space-y-5 animate-pulse">
                <div className="flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-40 bg-muted rounded-lg" />
                    <div className="h-3.5 w-24 bg-muted rounded-lg" />
                  </div>
                </div>
                <div className="h-12 w-full bg-muted rounded-xl" />
                <div className="h-10 w-full bg-muted rounded-xl" />
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
                transition={{ delay: i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="card-pro overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 flex items-start gap-4 border-b border-border">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400/80 border border-emerald-500/[0.15] shrink-0">
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
                <div className="p-6 space-y-5 flex-1">
                  {/* License Key */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">License Key</p>
                    <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 border border-border">
                      <code className="text-[12px] font-mono text-foreground flex-1 break-all tracking-widest">{license.licenseKey}</code>
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

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground/60">Licensed on</p>
                      <p className="text-[13px] font-medium">{formatDate(license.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground/60">Order ID</p>
                      <p className="text-[13px] font-mono text-muted-foreground truncate" title={license.orderId}>
                        #{license.orderId?.slice(0, 10)}…
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6 grid grid-cols-3 gap-2">
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
            className="apple-card py-32 px-12 text-center space-y-10"
          >
            <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto border border-border">
              <Vault size={40} weight="thin" className="text-foreground/40" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-tighter text-foreground leading-none">Your vault is empty</h2>
              <p className="text-muted-foreground max-w-md mx-auto font-medium leading-relaxed text-lg">
                Software you purchase will appear here, tied to <span className="text-foreground">{user.email}</span>.
              </p>
            </div>
            <Link href="/products" className="btn-apple btn-apple-primary inline-flex px-12 py-5 text-[14px]">
              Browse Products <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        )}

        {/* Support Callout */}
        {!isFetchingLicenses && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 card-pro p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          >
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
