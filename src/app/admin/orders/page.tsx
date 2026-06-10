"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, ShoppingBag, Package } from "@phosphor-icons/react";
import { getOrders, Order } from "@/lib/orders";
import { Glass, tableHeaderCls, LoadingSkeleton, StatusBadge } from "../_components/shared";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data);
      setIsLoading(false);
    });
  }, []);

  const filteredOrders = orders.filter(
    (o) =>
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerInfo.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (ts: unknown) => {
    try {
      const date = (ts as { toDate: () => Date }).toDate
        ? (ts as { toDate: () => Date }).toDate()
        : new Date(ts as string);
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "—", time: "" };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Orders</h1>
          <p className="text-white/30 text-[14px] mt-1">Customer purchases and transactions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <ShoppingBag size={16} weight="fill" className="text-indigo-400/80" />
          <span className="text-[13px] font-bold text-indigo-400/80">{orders.length} orders</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          placeholder="Search by product, payment ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl pl-11 pr-4 py-3.5 text-white text-[14px] font-medium placeholder:text-white/20 focus:outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Table */}
      <Glass className="rounded-[28px] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
              <th className={`px-8 py-5 ${tableHeaderCls}`}>Order / Date</th>
              <th className={`px-8 py-5 ${tableHeaderCls}`}>Product</th>
              <th className={`px-8 py-5 ${tableHeaderCls}`}>Customer</th>
              <th className={`px-8 py-5 ${tableHeaderCls}`}>Amount</th>
              <th className={`px-8 py-5 ${tableHeaderCls} text-right`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {isLoading ? (
              <LoadingSkeleton cols={5} rows={6} />
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <ShoppingBag size={22} className="text-white/20" />
                    </div>
                    <p className="text-white/25 text-[13px]">
                      {searchTerm ? "No orders match your search" : "No orders yet"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const { date, time } = formatDate(order.createdAt);
                return (
                  <tr key={order.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-white/30 text-[11px] font-mono truncate max-w-[140px]">{order.paymentId || "—"}</p>
                      <p className="text-white text-[13px] font-medium mt-0.5">{date}</p>
                      <p className="text-white/30 text-[11px]">{time}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                          <Package size={14} className="text-white/30" />
                        </div>
                        <p className="text-white text-[14px] font-medium">{order.productName}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/[0.12] flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-indigo-400/70">
                            {(order.customerInfo?.name || order.customerInfo?.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-[13px] font-medium leading-tight">{order.customerInfo?.name || "—"}</p>
                          <p className="text-white/30 text-[11px] font-mono leading-tight mt-0.5">{order.customerInfo?.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-white text-[14px] font-bold">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency || "USD" }).format(order.amount / 100)}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <StatusBadge status={order.status} glow />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Glass>
    </div>
  );
}
