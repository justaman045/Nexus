"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  CurrencyDollar,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  FileText,
  TrendUp,
} from "@phosphor-icons/react";
import { getOrders, Order } from "@/lib/orders";
import { getProducts } from "@/lib/products";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const glass = (extra?: object) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.08)",
  ...extra,
});

const STAT_COLORS = [
  { grad: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))", border: "rgba(99,102,241,0.35)", icon: "rgba(165,180,252,0.9)", glow: "rgba(99,102,241,0.3)" },
  { grad: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))", border: "rgba(34,197,94,0.3)", icon: "rgba(74,222,128,0.9)", glow: "rgba(34,197,94,0.25)" },
  { grad: "linear-gradient(135deg, rgba(168,85,247,0.22), rgba(139,92,246,0.14))", border: "rgba(168,85,247,0.32)", icon: "rgba(192,132,252,0.9)", glow: "rgba(168,85,247,0.28)" },
  { grad: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,114,182,0.12))", border: "rgba(236,72,153,0.3)", icon: "rgba(244,114,182,0.9)", glow: "rgba(236,72,153,0.25)" },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getProducts()]).then(([o, p]) => {
      setOrders(o);
      setProductCount(p.length);
      setLoading(false);
    });
  }, []);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const convRate = orders.length ? Math.round((paidOrders.length / orders.length) * 100) : 0;

  const stats = [
    { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag, change: "+12%", suffix: "" },
    { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: CurrencyDollar, change: "+8%", suffix: "" },
    { label: "Active Products", value: productCount.toString(), icon: Package, change: "Active", suffix: "" },
    { label: "Paid Orders", value: paidOrders.length.toString(), icon: CheckCircle, change: `${convRate}%`, suffix: "" },
  ];

  const recentOrders = orders.slice(0, 5);

  const formatDate = (ts: unknown) => {
    if (!ts) return "—";
    try {
      const date = (ts as { toDate: () => Date }).toDate ? (ts as { toDate: () => Date }).toDate() : new Date(ts as string);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "—"; }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[28px] font-bold tracking-tight"
            style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #c084fc 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            Overview
          </h1>
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "rgba(74,222,128,0.8)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.25)" }} className="text-[13px]">Real-time business metrics</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const c = STAT_COLORS[i];
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
              className="relative overflow-hidden rounded-[22px] p-6 group transition-all duration-300"
              style={{
                background: c.grad,
                border: `1px solid ${c.border}`,
                boxShadow: `0 4px 24px ${c.glow}`,
              }}
            >
              {/* Subtle inner glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[22px]"
                style={{ background: "rgba(255,255,255,0.03)" }} />

              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <stat.icon size={17} weight="fill" style={{ color: c.icon }} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {stat.change}
                </span>
              </div>

              {loading ? (
                <div className="h-9 w-16 rounded-lg animate-pulse mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
              ) : (
                <div className="text-[36px] font-bold tracking-tight text-white leading-none mb-1.5 relative z-10">
                  {stat.value}
                </div>
              )}
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] relative z-10"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
          className="xl:col-span-2 rounded-[24px] overflow-hidden"
          style={glass()}
        >
          <div className="flex items-center justify-between px-7 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={15} weight="fill" style={{ color: "#818cf8" }} />
              <h2 className="text-[14px] font-bold text-white">Recent Orders</h2>
            </div>
            <Link href="/admin/orders"
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: "rgba(165,180,252,0.6)" }}>
              View all <ArrowRight size={11} weight="bold" />
            </Link>
          </div>

          <div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-7 py-4 flex items-center gap-4">
                  <div className="h-3 w-32 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  <div className="h-3 w-16 rounded animate-pulse ml-auto" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div className="px-7 py-14 text-center text-[14px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                No orders yet
              </div>
            ) : (
              recentOrders.map((order, i) => (
                <div key={order.id}
                  className="px-7 py-4 flex items-center gap-4 group transition-colors"
                  style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Package size={13} weight="fill" style={{ color: "#818cf8" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {order.productName}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {order.customerInfo?.email || "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
                      ${order.amount.toFixed(2)}
                    </p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    order.status === "paid"
                      ? "bg-emerald-500/[0.08] text-emerald-400/70 border-emerald-500/[0.15]"
                      : order.status === "pending"
                      ? "bg-amber-500/[0.08] text-amber-400/70 border-amber-500/[0.15]"
                      : "bg-red-500/[0.08] text-red-400/70 border-red-500/[0.15]"
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.6, ease: EASE }}
          className="space-y-3"
        >
          <h2 className="text-[13px] font-bold px-1 mb-4" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Quick Actions
          </h2>
          {[
            { title: "Manage Products", desc: "Add, edit or remove products", href: "/admin/products", icon: Package, color: "#818cf8", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.2)" },
            { title: "Edit Content", desc: "Update homepage & CMS content", href: "/admin/content", icon: FileText, color: "#c084fc", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.2)" },
            { title: "View Orders", desc: "See all transactions", href: "/admin/orders", icon: TrendUp, color: "#34d399", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.18)" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="block p-5 rounded-[20px] transition-all duration-300 group relative overflow-hidden"
              style={glass()}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-[20px]"
                style={{ background: "rgba(255,255,255,0.025)" }} />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: action.bg, border: `1px solid ${action.border}` }}>
                    <action.icon size={16} weight="fill" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{action.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{action.desc}</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
