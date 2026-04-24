"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket, Eye, EyeSlash, Warning } from "@phosphor-icons/react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden"
      style={{ colorScheme: "dark" }}
    >
      {/* Glow */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-blue-600/[0.04] blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px] mx-4"
      >
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-[32px] p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <Rocket size={15} weight="fill" className="text-black" />
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
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 text-white text-[15px] font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
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
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 pr-12 text-white text-[15px] font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
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
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 bg-red-500/[0.07] border border-red-500/[0.12] rounded-xl px-4 py-3"
              >
                <Warning size={15} className="text-red-400/70 flex-shrink-0" />
                <span className="text-red-400/80 text-[13px] font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold text-[14px] py-3.5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 mt-2"
            >
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>

          <p className="text-center text-white/20 text-[12px] mt-8">
            Nexus Admin Console · Restricted Access
          </p>
        </div>
      </motion.div>
    </div>
  );
}
