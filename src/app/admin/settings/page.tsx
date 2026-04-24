"use client";

import { useState, useEffect } from "react";
import { updateHomepageContent, defaultContent } from "@/lib/cms";
import { seedProducts } from "@/lib/products";
import { getPaymentSettings, setPaymentGateway, setMultiCurrencyEnabled, PaymentGateway } from "@/lib/paymentSettings";
import { motion } from "framer-motion";
import { Database, Check, Warning, CircleNotch, CreditCard, ArrowsLeftRight, Globe, CurrencyDollar } from "@phosphor-icons/react";

const GATEWAYS = [
  {
    id: "razorpay" as PaymentGateway,
    name: "Razorpay",
    description: "Best for India & South Asia. Supports UPI, cards, net banking.",
    color: "#3395FF",
    envRequired: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID"],
  },
  {
    id: "stripe" as PaymentGateway,
    name: "Stripe",
    description: "Global payments. Cards, Apple Pay, Google Pay & more.",
    color: "#635BFF",
    envRequired: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  },
];

export default function AdminSettings() {
  const [dbStatus, setDbStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [dbMessage, setDbMessage] = useState("");

  const [currentGateway, setCurrentGateway] = useState<PaymentGateway | null>(null);
  const [gwLoading, setGwLoading] = useState(true);
  const [gwSaving, setGwSaving] = useState(false);
  const [gwStatus, setGwStatus] = useState<"idle" | "success" | "error">("idle");

  const [multiCurrency, setMultiCurrency] = useState(true);
  const [mcSaving, setMcSaving] = useState(false);
  const [mcStatus, setMcStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    getPaymentSettings().then(s => {
      setCurrentGateway(s.gateway);
      setMultiCurrency(s.multiCurrencyEnabled !== false);
      setGwLoading(false);
    }).catch(() => {
      setCurrentGateway("razorpay");
      setGwLoading(false);
    });
  }, []);

  const handleToggleMultiCurrency = async (enabled: boolean) => {
    if (mcSaving) return;
    setMcSaving(true);
    setMcStatus("idle");
    try {
      await setMultiCurrencyEnabled(enabled);
      setMultiCurrency(enabled);
      setMcStatus("success");
    } catch {
      setMcStatus("error");
    } finally {
      setMcSaving(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm("This will overwrite existing content with default data. Continue?")) return;
    setDbStatus("loading");
    try {
      await updateHomepageContent(defaultContent);
      await seedProducts();
      setDbStatus("success");
      setDbMessage("Database populated with default content and products.");
    } catch (e) {
      console.error(e);
      setDbStatus("error");
      setDbMessage("Failed to seed database. Check console.");
    }
  };

  const handleSwitchGateway = async (gateway: PaymentGateway) => {
    if (gateway === currentGateway || gwSaving) return;
    setGwSaving(true);
    setGwStatus("idle");
    try {
      await setPaymentGateway(gateway);
      setCurrentGateway(gateway);
      setGwStatus("success");
    } catch {
      setGwStatus("error");
    } finally {
      setGwSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight">Settings</h1>
        <p className="text-white/30 text-[14px] mt-1">System configuration and tools</p>
      </div>

      {/* ── PAYMENT GATEWAY ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 rounded-[28px]" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40">
            <CreditCard size={18} weight="regular" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-white">Payment Gateway</h3>
            <p className="text-white/30 text-[12px]">Switch the active payment processor</p>
          </div>
        </div>

        <p className="text-white/40 text-[13px] leading-relaxed mt-5 mb-6">
          Choose which payment provider handles all purchases. The switch takes effect immediately for new checkouts.
          Make sure the required environment variables are set before switching.
        </p>

        {gwLoading ? (
          <div className="flex items-center gap-2 text-white/30 text-[13px]">
            <CircleNotch size={14} className="animate-spin" /> Loading current gateway…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GATEWAYS.map((gw) => {
              const isActive = currentGateway === gw.id;
              return (
                <button
                  key={gw.id}
                  onClick={() => handleSwitchGateway(gw.id)}
                  disabled={gwSaving}
                  className={`relative text-left p-5 rounded-2xl border transition-all duration-300 disabled:opacity-50 ${
                    isActive
                      ? "border-white/25 bg-white/[0.10]"
                      : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/15"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: gw.color + "22", color: gw.color }}
                    >
                      ACTIVE
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-black"
                      style={{ background: gw.color + "18", color: gw.color }}
                    >
                      {gw.name[0]}
                    </div>
                    <span className="text-[15px] font-bold text-white">{gw.name}</span>
                  </div>

                  <p className="text-white/40 text-[12px] leading-relaxed">{gw.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {gw.envRequired.map(env => (
                      <span key={env} className="text-[10px] font-mono text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-md">
                        {env}
                      </span>
                    ))}
                  </div>

                  {!isActive && (
                    <div className="mt-4 flex items-center gap-1.5 text-white/30 text-[12px] font-semibold">
                      <ArrowsLeftRight size={12} />
                      Switch to {gw.name}
                    </div>
                  )}

                  {isActive && gwSaving && (
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40">
                      <CircleNotch size={18} className="animate-spin text-white/60" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {gwStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-2.5 bg-emerald-500/[0.08] border border-emerald-500/[0.12] text-emerald-400/80 px-4 py-3 rounded-xl text-[13px] font-medium"
          >
            <Check size={15} weight="bold" />
            Gateway switched successfully. New purchases will use {GATEWAYS.find(g => g.id === currentGateway)?.name}.
          </motion.div>
        )}

        {gwStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-2.5 bg-red-500/[0.07] border border-red-500/[0.12] text-red-400/80 px-4 py-3 rounded-xl text-[13px] font-medium"
          >
            <Warning size={15} />
            Failed to switch gateway. Check Firestore permissions.
          </motion.div>
        )}
      </motion.div>

      {/* ── MULTI-CURRENCY ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 rounded-[28px]"
        style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40">
              <Globe size={18} weight="regular" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white">Multi-Currency Pricing</h3>
              <p className="text-white/30 text-[12px]">Show prices in the user's local currency</p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={() => handleToggleMultiCurrency(!multiCurrency)}
            disabled={mcSaving || gwLoading}
            className="relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 disabled:opacity-40"
            style={{ background: multiCurrency ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.1)" }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
              style={{ left: multiCurrency ? "calc(100% - 22px)" : "2px" }}
            />
            {mcSaving && <CircleNotch size={12} className="animate-spin absolute inset-0 m-auto text-white/60" />}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { flag: "🇮🇳", label: "India", currency: "₹ INR" },
            { flag: "🇺🇸", label: "USA", currency: "$ USD" },
            { flag: "🇯🇵", label: "Japan", currency: "¥ JPY" },
            { flag: "🇬🇧", label: "UK", currency: "£ GBP" },
            { flag: "🇪🇺", label: "Europe", currency: "€ EUR" },
            { flag: "🌏", label: "40+ more", currency: "Auto" },
          ].map(({ flag, label, currency }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[18px]">{flag}</span>
              <div className="flex-1">
                <span className="text-white/60 text-[12px] font-medium">{label}</span>
              </div>
              <span className="text-[11px] font-mono font-bold"
                style={{ color: multiCurrency ? "#a5b4fc" : "rgba(255,255,255,0.25)" }}>
                {multiCurrency ? currency : "$ USD"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-[12px] leading-relaxed mt-5">
          {multiCurrency
            ? "Enabled — prices are automatically detected from the user's IP and shown in their local currency using live exchange rates."
            : "Disabled — all users see prices in US Dollars (USD) regardless of location."}
        </p>

        {mcStatus === "success" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/[0.12] text-emerald-400/80 px-4 py-2.5 rounded-xl text-[12px] font-medium">
            <Check size={14} weight="bold" />
            {multiCurrency ? "Multi-currency enabled." : "Disabled — all users see USD."}
          </motion.div>
        )}
        {mcStatus === "error" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 bg-red-500/[0.07] border border-red-500/[0.12] text-red-400/80 px-4 py-2.5 rounded-xl text-[12px] font-medium">
            <Warning size={14} /> Failed to update. Check Firestore permissions.
          </motion.div>
        )}
      </motion.div>

      {/* ── DATABASE TOOLS ── */}
      <div className="max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 rounded-[28px]" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40">
              <Database size={18} weight="regular" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white">Database Tools</h3>
              <p className="text-white/30 text-[12px]">Initialize with default content</p>
            </div>
          </div>

          <p className="text-white/40 text-[13px] leading-relaxed mb-7">
            Populate your Firestore database with default homepage content and sample products.
            Existing content will be overwritten.
          </p>

          <button
            onClick={handleSeedDatabase}
            disabled={dbStatus === "loading"}
            className="flex items-center gap-2.5 bg-white text-black font-bold text-[13px] px-6 py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            {dbStatus === "loading" && <CircleNotch size={14} className="animate-spin" />}
            {dbStatus === "loading" ? "Seeding…" : "Seed Database"}
          </button>

          {dbStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-2.5 bg-emerald-500/[0.08] border border-emerald-500/[0.12] text-emerald-400/80 px-4 py-3 rounded-xl text-[13px] font-medium"
            >
              <Check size={15} weight="bold" />
              {dbMessage}
            </motion.div>
          )}

          {dbStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-2.5 bg-red-500/[0.07] border border-red-500/[0.12] text-red-400/80 px-4 py-3 rounded-xl text-[13px] font-medium"
            >
              <Warning size={15} />
              {dbMessage}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
