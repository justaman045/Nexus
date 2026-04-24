"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, CircleNotch, ShoppingBag } from "@phosphor-icons/react";
import { getOrders, Order } from "@/lib/orders";

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
        <div className="flex items-center gap-2 bg-blue-500/[0.08] text-blue-400/80 border border-blue-500/[0.12] px-4 py-2.5 rounded-xl">
          <ShoppingBag size={16} weight="fill" />
          <span className="text-[13px] font-bold">{orders.length} orders</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          placeholder="Search by product, payment ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm bg-white/[0.02] border border-white/[0.05] rounded-2xl pl-11 pr-4 py-3.5 text-white text-[14px] font-medium placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-[28px] overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Order / Date</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Product</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Customer</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Amount</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <CircleNotch size={24} className="animate-spin text-white/20 mx-auto" />
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-white/25 text-[13px]">
                  {searchTerm ? "No orders match your search" : "No orders yet"}
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
                      <p className="text-white text-[14px] font-medium">{order.productName}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-white text-[13px] font-medium">{order.customerInfo?.name || "—"}</p>
                      <p className="text-white/30 text-[11px] font-mono mt-0.5">{order.customerInfo?.email || "—"}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-white text-[14px] font-bold">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency || "USD" }).format(order.amount / 100)}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                          order.status === "paid"
                            ? "bg-emerald-500/[0.08] text-emerald-400/70 border-emerald-500/[0.1]"
                            : order.status === "pending"
                            ? "bg-amber-500/[0.08] text-amber-400/70 border-amber-500/[0.1]"
                            : "bg-red-500/[0.08] text-red-400/70 border-red-500/[0.1]"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
