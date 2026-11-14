"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Warning, Check, ArrowClockwise, EnvelopeSimple, Rocket, ShieldCheck } from "@phosphor-icons/react";

export default function AdminVerify() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string | null; emailVerified: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? { email: u.email ?? null, emailVerified: u.emailVerified } : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/admin/dashboard");
    }
  }, [user, router]);

  const handleSendVerification = async () => {
    if (!user?.email || sending) return;
    setSending(true);
    setStatus("idle");
    setStatusMessage("");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setStatus("error");
        setStatusMessage("No signed-in user found.");
        return;
      }
      await sendEmailVerification(currentUser);
      setStatus("success");
      setStatusMessage("Verification email sent. Please check your inbox and click the link, then click 'Check Status' below.");
    } catch {
      setStatus("error");
      setStatusMessage("Failed to send verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      await auth.currentUser?.reload();
    } catch {
      // reload may fail if token is stale; onAuthStateChanged will pick up changes
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05050f" }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Rocket size={18} weight="fill" style={{ color: "rgba(255,255,255,0.6)" }} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#05050f" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[440px] mx-4 z-10"
      >
        <div className="rounded-[32px] p-10"
          style={{
            background: "rgba(255,255,255,0.035)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <ShieldCheck size={20} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-white tracking-tight">Verify Account</h1>
              <p className="text-white/40 text-[13px]">Confirm your email before accessing the admin console</p>
            </div>
          </div>

          {/* User info */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.14em]">Email</span>
              <span className="text-white text-[14px] font-medium truncate max-w-[280px]">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {user.emailVerified ? (
                <span className="flex items-center gap-1.5 text-emerald-400 text-[12px] font-medium">
                  <Check size={14} className="flex-shrink-0" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 text-[12px] font-medium">
                  <Warning size={14} className="flex-shrink-0" />
                  Not Verified
                </span>
              )}
            </div>
          </div>

          {/* Status message */}
          {status !== "idle" && (
            <div className={`mb-6 rounded-xl px-4 py-3.5 text-[12px] font-medium ${
              status === "success"
                ? "bg-emerald-500/[0.08] border border-emerald-500/[0.12] text-emerald-400/80"
                : "bg-red-500/[0.07] border border-red-500/[0.12] text-red-400/80"
            }`}>
              {status === "success" ? <Check size={14} className="mr-2 flex-shrink-0" /> : <Warning size={14} className="mr-2 flex-shrink-0" />}
              {statusMessage}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!user.emailVerified && (
              <button
                onClick={handleSendVerification}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 font-bold text-[13px] px-5 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 rounded-full bg-white/80"
                    />
                    Sending…
                  </span>
                ) : (
                  <>
                    <EnvelopeSimple size={16} weight="fill" />
                    Send Verification Email
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleCheckStatus}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-medium text-[12px] px-5 py-2.5 rounded-xl transition-all hover:bg-white/[0.05] text-white/60 border border-white/[0.06]"
            >
              {loading ? (
                <ArrowClockwise size={14} className="animate-spin" />
              ) : (
                <ArrowClockwise size={14} />
              )}
              {user.emailVerified ? "Verified — Continue to Dashboard" : "Check Verification Status"}
            </button>
          </div>

          <p className="text-center text-white/20 text-[11px] mt-10">
            Nexus Admin Console · Email verification required
          </p>
        </div>
      </motion.div>
    </div>
  );
}
