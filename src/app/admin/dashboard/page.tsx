"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Package, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { getHomepageContent, defaultContent } from "@/lib/cms";

export default function AdminDashboard() {
    const [stats, setStats] = useState([
        { label: "Active Users", value: "...", icon: Users, change: "+12%", color: "blue" },
        { label: "Downloads", value: "...", icon: TrendingUp, change: "+8%", color: "green" },
        { label: "Active Products", value: "...", icon: Package, change: "+0", color: "purple" },
        { label: "Countries", value: "...", icon: Users, change: "+5", color: "pink" },
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const [products, cmsContent] = await Promise.all([
                    getProducts(),
                    getHomepageContent()
                ]);

                // Use default content if CMS content is missing (fallback)
                const content = cmsContent || defaultContent;
                const productCount = products.length;

                // Map CMS stats to dashboard cards
                // Assuming CMS stats order: [Active Users, Downloads, Countries, Uptime]
                // We'll map them dynamically or by index for now to match the dashboard layout
                setStats([
                    {
                        label: content.stats[0]?.label || "Active Users",
                        value: content.stats[0]?.value || "0",
                        icon: Users,
                        change: "+12%",
                        color: "blue"
                    },
                    {
                        label: content.stats[1]?.label || "Downloads",
                        value: content.stats[1]?.value || "0",
                        icon: TrendingUp,
                        change: "+8%",
                        color: "green"
                    },
                    {
                        label: "Active Products",
                        value: productCount.toString(),
                        icon: Package,
                        change: "+2",
                        color: "purple"
                    },
                    {
                        label: content.stats[2]?.label || "Countries",
                        value: content.stats[2]?.value || "0",
                        icon: Users,
                        change: "+5",
                        color: "pink"
                    },
                ]);
            } catch (error) {
                console.error("Error fetching dashboard metrics:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Dashboard Overview</h1>
                <p className="text-gray-400 mt-2">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-6 rounded-2xl border border-white/10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                                {stat.change}
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-8 rounded-2xl border border-white/10"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">System updated</div>
                                        <div className="text-xs text-gray-500">Just now</div>
                                    </div>
                                </div>
                                <span className="text-sm text-blue-400">View</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-8 rounded-2xl border border-white/10"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/products" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-left group block">
                            <Package className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                            <div className="font-bold text-white">Add Product</div>
                            <div className="text-xs text-gray-400 mt-1">Create a new software listing</div>
                        </Link>
                        <Link href="/admin/content" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-left group block">
                            <TrendingUp className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                            <div className="font-bold text-white">Update Stats</div>
                            <div className="text-xs text-gray-400 mt-1">Modify homepage numbers</div>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
