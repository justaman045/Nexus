"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SquaresFour,
  Package,
  FileText,
  ShoppingBag,
  Gear,
  Rocket,
  SignOut,
} from "@phosphor-icons/react";

const navItems = [
  { name: "Overview", href: "/admin/dashboard", icon: SquaresFour },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Content", href: "/admin/content", icon: FileText },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Settings", href: "/admin/settings", icon: Gear },
];

const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderRight: "1px solid rgba(255,255,255,0.07)",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        if (pathname !== "/admin/login") router.push("/admin/login");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router, pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;

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

  if (!authenticated) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#05050f", colorScheme: "dark" }}>
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      {/* Sidebar */}
      <aside className="w-[240px] fixed h-full z-20 flex flex-col" style={glass}>
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
              <Rocket size={15} weight="fill" className="text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Nexus</span>
          </Link>
          <div className="mt-1.5 text-[9px] text-white/20 font-bold tracking-[0.22em] uppercase ml-[42px]">
            Admin Console
          </div>
        </div>

        {/* Section label */}
        <div className="px-6 mb-2">
          <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-white/20">Management</span>
        </div>

        {/* Nav */}
        <nav className="px-3 flex-1 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium relative overflow-hidden group"
                style={isActive ? {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.18))",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "rgba(255,255,255,0.95)",
                } : {
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {!isActive && (
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)" }} />
                )}
                <item.icon
                  size={15}
                  weight={isActive ? "fill" : "regular"}
                  style={{ color: isActive ? "#a5b4fc" : undefined }}
                />
                <span style={{ color: isActive ? "rgba(255,255,255,0.9)" : undefined }}>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#818cf8", boxShadow: "0 0 6px rgba(129,140,248,0.8)" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-7">
          <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all text-[13px] font-medium group"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              <SignOut size={15} />
              <span className="group-hover:text-red-400/80 transition-colors">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] flex-1 min-h-screen relative z-10">
        <div className="p-10">{children}</div>
      </main>
    </div>
  );
}
