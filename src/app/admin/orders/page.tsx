"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, ShoppingBag } from "lucide-react";
import { getOrders, Order } from "@/lib/orders";

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        setIsLoading(true);
        const data = await getOrders();
        setOrders(data);
        setIsLoading(false);
    }

    const filteredOrders = orders.filter(order =>
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Orders</h1>
                    <p className="text-gray-400 mt-1">View and manage customer purchases</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/20">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="font-bold">{orders.length} Total Orders</span>
                </div>
            </div>

            {/* Search */}
            <div className="glass p-4 rounded-xl border border-white/10">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by product, payment ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-12 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-6 text-sm font-semibold text-gray-400">Order ID / Date</th>
                            <th className="p-6 text-sm font-semibold text-gray-400">Product</th>
                            <th className="p-6 text-sm font-semibold text-gray-400">Customer</th>
                            <th className="p-6 text-sm font-semibold text-gray-400">Amount</th>
                            <th className="p-6 text-sm font-semibold text-gray-400 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-6">
                                        <div className="font-mono text-xs text-gray-500 mb-1">{order.paymentId || "N/A"}</div>
                                        <div className="text-white text-sm">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt as any).toLocaleDateString()} <span className="text-gray-600">at</span> {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : new Date(order.createdAt as any).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="font-medium text-white">{order.productName}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-white text-sm">{order.customerInfo.name || "Unknown"}</div>
                                        <div className="text-xs text-gray-500">{order.customerInfo.email}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="font-medium text-white">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.amount)}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'paid'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : order.status === 'pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
