"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket, Eye, EyeSlash, Warning, GoogleLogo } from "@phosphor-icons/react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/admin/dashboard");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#05050f", colorScheme: "dark" }}
    >
      {/* Ambient orbs — matching admin layout */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      {/* Dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px] mx-4 z-10"
      >
        <div className="rounded-[32px] p-10"
          style={{
            background: "rgba(255,255,255,0.035)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}>
              <Rocket size={15} weight="fill" className="text-white" />
            </div>
            <div>
              <span className="font-bold text-[15px] text-white tracking-tight">Nexus</span>
              <span className="text-white/25 text-[11px] font-bold tracking-[0.15em] uppercase ml-2">
                Admin
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[26px] font-bold text-white tracking-tight mb-1">
            Welcome back
          </h1>
          <p className="text-white/40 text-[14px] mb-8">
            Sign in to access the admin console
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.14em] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexus.com"
                required
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 text-white text-[15px] font-medium placeholder:text-white/20 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.14em] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 pr-12 text-white text-[15px] font-medium placeholder:text-white/20 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-all focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center gap-2.5 bg-red-500/[0.07] border border-red-500/[0.12] rounded-xl px-4 py-3"
              >
                <Warning size={15} className="text-red-400/70 flex-shrink-0" />
                <span className="text-red-400/80 text-[13px] font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full font-bold text-[14px] py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-40 mt-2 text-white"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 rounded-full bg-white/80"
                  />
                  <motion.span
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-white/80"
                  />
                  <motion.span
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-white/80"
                  />
                </span>
              ) : "Continue"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.14em]">or</span>
            <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 font-medium text-[14px] transition-all hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            {googleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-white/20"
                  style={{ borderTopColor: "rgba(255,255,255,0.8)" }}
                />
                Signing in…
              </span>
            ) : (
              <>
                <GoogleLogo size={20} weight="bold" />
                Sign in with Google
              </>
            )}
          </button>

          <p className="text-center text-white/20 text-[12px] mt-8">
            Nexus Admin Console · Restricted Access
          </p>
        </div>
      </motion.div>
    </div>
  );
}
