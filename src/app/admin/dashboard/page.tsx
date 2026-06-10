"use client";

import { useEffect, useState, useMemo } from "react";
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
  Clock,
  Plus,
  Sparkle,
} from "@phosphor-icons/react";
import { getOrders, Order } from "@/lib/orders";
import { getProducts, Product } from "@/lib/products";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const glass = (extra?: object) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.08)",
  ...extra,
});

const STAT_COLORS = [
  { grad: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))", border: "rgba(99,102,241,0.35)", icon: "rgba(165,180,252,0.9)", glow: "rgba(99,102,241,0.3)", accent: "#818cf8" },
  { grad: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))", border: "rgba(34,197,94,0.3)", icon: "rgba(74,222,128,0.9)", glow: "rgba(34,197,94,0.25)", accent: "#34d399" },
  { grad: "linear-gradient(135deg, rgba(168,85,247,0.22), rgba(139,92,246,0.14))", border: "rgba(168,85,247,0.32)", icon: "rgba(192,132,252,0.9)", glow: "rgba(168,85,247,0.28)", accent: "#c084fc" },
  { grad: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,114,182,0.12))", border: "rgba(236,72,153,0.3)", icon: "rgba(244,114,182,0.9)", glow: "rgba(236,72,153,0.25)", accent: "#f472b6" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatTime(ts: unknown) {
  if (!ts) return "";
  try {
    const date = (ts as { toDate: () => Date }).toDate ? (ts as { toDate: () => Date }).toDate() : new Date(ts as string);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1m ago";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 80, h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={`M${points}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * h} r="2" fill={color} />
    </svg>
  );
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-1.5 h-32 pt-4">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-[9px] font-bold text-white/40">{d.value > 0 ? formatCurrency(d.value) : ""}</span>
          <div
            className="w-full rounded-t-md transition-all duration-700 relative group"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: `linear-gradient(to top, ${color}40, ${color}20)`,
              borderTop: `1px solid ${color}50`,
            }}
          >
            <div className="absolute inset-0 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to top, ${color}30, transparent)` }} />
          </div>
          <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getProducts()]).then(([o, p]) => {
      setOrders(o);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const paidOrders = useMemo(() => orders.filter((o) => o.status === "paid"), [orders]);
  const totalRevenue = useMemo(() => paidOrders.reduce((sum, o) => sum + o.amount, 0), [paidOrders]);
  const convRate = orders.length ? Math.round((paidOrders.length / orders.length) * 100) : 0;
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const productSales = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of paidOrders) {
      counts[o.productName] = (counts[o.productName] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [paidOrders]);

  const dailyRevenue = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const total = paidOrders
        .filter((o) => {
          const t = o.createdAt && typeof (o.createdAt as { toDate?: () => Date }).toDate === "function"
            ? (o.createdAt as { toDate: () => Date }).toDate().getTime()
            : new Date(o.createdAt as unknown as string).getTime();
          return t >= dayStart && t < dayEnd;
        })
        .reduce((s, o) => s + o.amount, 0);
      days.push({ label: key, value: total });
    }
    return days;
  }, [paidOrders]);

  const stats = useMemo(() => [
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, change: `${convRate}% paid`, color: 0 },
    { label: "Revenue", value: totalRevenue, icon: CurrencyDollar, change: "Total", color: 1, prefix: "$" },
    { label: "Active Products", value: products.length, icon: Package, change: "Listed", color: 2 },
    { label: "Paid Orders", value: paidOrders.length, icon: CheckCircle, change: `${convRate}% rate`, color: 3 },
  ], [orders.length, totalRevenue, products.length, paidOrders.length, convRate]);

  const sparklineData = useMemo(() => dailyRevenue.map(d => d.value), [dailyRevenue]);
  const topProductMax = productSales[0]?.count || 1;

  const activityItems = useMemo(() => {
    const items: { type: string; title: string; time: Date; id: string }[] = [];
    for (const o of orders.slice(0, 4)) {
      const t = o.createdAt && typeof (o.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (o.createdAt as { toDate: () => Date }).toDate()
        : new Date(o.createdAt as unknown as string);
      items.push({ type: "order", title: `${o.productName} purchased`, time: t, id: o.id || "" });
    }
    if (products.length > 0) {
      const latest = [...products].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
      items.push({ type: "product", title: `${latest.name} added`, time: new Date(latest.createdAt || Date.now()), id: latest.id });
    }
    return items.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);
  }, [orders, products]);

  const lastUpdated = useMemo(() => timeAgo(new Date()), []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-[22px] p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-9 h-9 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="h-9 w-24 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="h-3 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 rounded-[24px] p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", height: 280 }} />
          <div className="rounded-[24px] p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", height: 280 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[28px] font-bold tracking-tight"
            style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #c084fc 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {greeting()}
          </h1>
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "rgba(74,222,128,0.8)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-4">
          <p style={{ color: "rgba(255,255,255,0.25)" }} className="text-[13px]">Here&apos;s what&apos;s happening with your store.</p>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            <Clock size={10} /> Updated {lastUpdated}
          </span>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const c = STAT_COLORS[stat.color];
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
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[22px]"
                style={{ background: "rgba(255,255,255,0.03)" }} />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <stat.icon size={17} weight="fill" style={{ color: c.icon }} />
                </div>
                <div className="flex items-center gap-2">
                  <Sparkline data={sparklineData} color={c.accent} />
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {stat.change}
                  </span>
                </div>
              </div>

              <div className="text-[36px] font-bold tracking-tight text-white leading-none mb-1.5 relative z-10 mt-4">
                {stat.prefix || ""}
                {stat.label === "Revenue" ? (
                  <>${totalRevenue.toLocaleString()}</>
                ) : (
                  <AnimatedNumber value={stat.value} />
                )}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] relative z-10"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Middle: Chart + Top Products ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue Chart */}
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
              <TrendUp size={15} weight="fill" style={{ color: "#818cf8" }} />
              <h2 className="text-[14px] font-bold text-white">Daily Revenue (7 days)</h2>
            </div>
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
              {formatCurrency(dailyRevenue.reduce((s, d) => s + d.value, 0))} total
            </span>
          </div>
          <div className="px-7 py-6">
            {dailyRevenue.every(d => d.value === 0) ? (
              <div className="flex items-center justify-center h-32 text-[14px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                No revenue data yet
              </div>
            ) : (
              <BarChart data={dailyRevenue} color={STAT_COLORS[0].accent} />
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.6, ease: EASE }}
          className="rounded-[24px] overflow-hidden"
          style={glass()}
        >
          <div className="flex items-center justify-between px-7 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5">
              <Package size={15} weight="fill" style={{ color: "#c084fc" }} />
              <h2 className="text-[14px] font-bold text-white">Top Products</h2>
            </div>
          </div>
          <div className="px-7 py-5 space-y-3">
            {productSales.length === 0 ? (
              <div className="py-6 text-center text-[14px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                No sales yet
              </div>
            ) : (
              productSales.map((p, i) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium truncate mr-2" style={{ color: "rgba(255,255,255,0.7)" }}>{p.name}</span>
                    <span className="font-bold shrink-0" style={{ color: "#c084fc" }}>{p.count}x</span>
                  </div>
                  <div className="h-1.5 rounded-full w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.count / topProductMax) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: EASE }}
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #a855f7, #c084fc)",
                        boxShadow: "0 0 8px rgba(168,85,247,0.3)",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom: Timeline + Quick Actions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
          className="xl:col-span-2 rounded-[24px] overflow-hidden"
          style={glass()}
        >
          <div className="flex items-center justify-between px-7 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5">
              <Sparkle size={15} weight="fill" style={{ color: "#f472b6" }} />
              <h2 className="text-[14px] font-bold text-white">Activity</h2>
            </div>
            <Link href="/admin/orders"
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: "rgba(165,180,252,0.6)" }}>
              View all <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
          <div className="px-7 py-6">
            {activityItems.length === 0 ? (
              <div className="py-6 text-center text-[14px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                No activity yet
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="space-y-5">
                  {activityItems.map((item, i) => (
                    <motion.div
                      key={`${item.type}-${item.id}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.06, duration: 0.5, ease: EASE }}
                      className="flex items-start gap-4"
                    >
                      <div
                        className="w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10"
                        style={{
                          background: item.type === "order"
                            ? "rgba(99,102,241,0.2)"
                            : "rgba(168,85,247,0.2)",
                          border: item.type === "order"
                            ? "1px solid rgba(99,102,241,0.3)"
                            : "1px solid rgba(168,85,247,0.3)",
                        }}
                      >
                        {item.type === "order"
                          ? <ShoppingBag size={10} weight="fill" style={{ color: "#818cf8" }} />
                          : <Package size={10} weight="fill" style={{ color: "#c084fc" }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {item.title}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                          {timeAgo(item.time)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.57, duration: 0.6, ease: EASE }}
          className="rounded-[24px] overflow-hidden"
          style={glass()}
        >
          <div className="flex items-center justify-between px-7 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={15} weight="fill" style={{ color: "#34d399" }} />
              <h2 className="text-[14px] font-bold text-white">Recent</h2>
            </div>
            <Link href="/admin/orders"
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: "rgba(165,180,252,0.6)" }}>
              View all <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
          <div>
            {recentOrders.length === 0 ? (
              <div className="px-7 py-14 text-center text-[14px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                No orders yet
              </div>
            ) : (
              recentOrders.map((order, i) => (
                <div key={order.id}
                  className="px-7 py-4 flex items-center gap-3 group transition-colors"
                  style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Package size={13} weight="fill" style={{ color: "#818cf8" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {order.productName}
                    </p>
                    <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <span>{order.customerInfo?.email || "—"}</span>
                      <span>&middot;</span>
                      <span>{formatTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ml-1 ${
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
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.64, duration: 0.6, ease: EASE }}
      >
        <h2 className="text-[13px] font-bold px-1 mb-4" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Manage Products", desc: "Add, edit or remove products", href: "/admin/products", icon: Package, color: "#818cf8", bg: "rgba(99,102,241,0.12)", hover: "rgba(99,102,241,0.08)" },
            { title: "Edit Content", desc: "Update homepage & CMS content", href: "/admin/content", icon: FileText, color: "#c084fc", bg: "rgba(168,85,247,0.12)", hover: "rgba(168,85,247,0.08)" },
            { title: "View Orders", desc: "See all transactions", href: "/admin/orders", icon: TrendUp, color: "#34d399", bg: "rgba(34,197,94,0.1)", hover: "rgba(34,197,94,0.07)" },
          ].map((action, i) => (
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
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden"
                    style={{ background: action.bg, border: `1px solid ${action.hover}` }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `radial-gradient(circle at center, ${action.color}15, transparent)` }} />
                    <action.icon size={18} weight="fill" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{action.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{action.desc}</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Empty State (when no data at all) ── */}
      {orders.length === 0 && products.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: EASE }}
          className="rounded-[24px] p-10 text-center relative overflow-hidden"
          style={glass()}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)", filter: "blur(40px)" }} />
          </div>
          <div className="relative space-y-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Sparkle size={28} weight="fill" style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-white tracking-tight">Welcome to your admin</h3>
              <p className="text-[14px] mt-2 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.3)" }}>
                Get started by adding your first product, then customize your storefront content.
              </p>
            </div>
            <div className="max-w-sm mx-auto space-y-3 text-left">
              {[
                { step: "1", text: "Add products", done: false },
                { step: "2", text: "Customize homepage content", done: false },
                { step: "3", text: "Configure payment settings", done: false },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 py-2 px-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                    {item.step}
                  </span>
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>{item.text}</span>
                  <ArrowRight size={12} className="ml-auto" style={{ color: "rgba(255,255,255,0.15)" }} />
                </div>
              ))}
            </div>
            <Link href="/admin/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[13px] transition-all"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "white",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}>
              <Plus size={15} weight="bold" /> Add Your First Product
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
