"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Calendar, DollarSign, ArrowRight, Loader2, X, Receipt, CreditCard, User, Mail, Phone } from "lucide-react";
import { collection, query, where, getDocs, orderBy as firestoreOrderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Order {
    id: string;
    productId: string;
    productName: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    orderId: string;
    paymentId?: string;
    customerInfo?: {
        name: string;
        email: string;
        contact: string;
    };
}

export default function OrderHistoryPage() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [email, setEmail] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setHasSearched(true);
        setOrders([]);

        try {
            // Query by email
            const q = query(
                collection(db, "orders"),
                where("customerInfo.email", "==", email.trim())
            );

            const querySnapshot = await getDocs(q);
            const foundOrders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));

            // Sort client-side to avoid compound index requirement for now
            foundOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setOrders(foundOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            alert("Failed to fetch orders. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30">
            <Navbar />

            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Track Your Orders
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Enter the email address used during checkout to view your purchase history and license details.
                        </p>
                    </div>

                    {/* Search Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto"
                    >
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Track"}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Results */}
                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {hasSearched && orders.length === 0 && !isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-gray-500"
                                >
                                    No orders found for this email.
                                </motion.div>
                            )}

                            {orders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-1">
                                                    {order.productName}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {order.status.toUpperCase()}
                                                    </div>
                                                    <div className="text-gray-500 font-mono text-xs pt-0.5">
                                                        ID: {order.orderId}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 pl-14 md:pl-0">
                                            <div className="text-2xl font-bold text-white">
                                                {/* Convert/Format currency if needed, assuming stored in whole units or needs /100 depending on storage. 
                                                   Razorpay API returns paise, but our mock products are whole dollars.
                                                   Let's assume stored as is from product.price for now.
                                                */}
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency || 'USD' }).format(order.amount)}
                                            </div>
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {selectedOrder && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                                    onClick={() => setSelectedOrder(null)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                                >
                                    <div id="receipt-content" className="glass w-full max-w-lg rounded-2xl border border-white/10 pointer-events-auto overflow-hidden shadow-2xl">
                                        {/* Modal Header */}
                                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                                    <Receipt className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-white">Payment Receipt</h2>
                                                    <p className="text-sm text-gray-400">{selectedOrder.orderId}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedOrder(null)}
                                                className="text-gray-400 hover:text-white transition-colors no-print"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {/* Modal Content */}
                                        <div className="p-6 space-y-6">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                                <span className="text-gray-400">Amount Paid</span>
                                                <span className="text-2xl font-bold text-white">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selectedOrder.currency || 'USD' }).format(selectedOrder.amount)}
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Transaction Details</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment ID</span>
                                                        <span className="text-white font-mono text-sm">{selectedOrder.paymentId || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                                                        <span className="text-white text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 flex items-center gap-2"><div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div> Status</span>
                                                        <span className="text-emerald-400 font-medium text-sm px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">{selectedOrder.status.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedOrder.customerInfo && (
                                                <div className="space-y-4 pt-4 border-t border-white/10">
                                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Customer Information</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400 flex items-center gap-2"><User className="w-4 h-4" /> Name</span>
                                                            <span className="text-white text-sm">{selectedOrder.customerInfo.name}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</span>
                                                            <span className="text-white text-sm">{selectedOrder.customerInfo.email}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400 flex items-center gap-2"><Phone className="w-4 h-4" /> Contact</span>
                                                            <span className="text-white text-sm">{selectedOrder.customerInfo.contact}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 bg-white/5 border-t border-white/10 no-print">
                                            <button
                                                onClick={() => window.print()}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                            >
                                                <Receipt className="w-4 h-4" /> Print Receipt
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            <Footer />

            <style jsx global>{`
                @media print {
                    /* 1. Hide everything by default */
                    body * {
                        visibility: hidden;
                    }

                    /* 2. Show only the receipt and its children */
                    #receipt-content,
                    #receipt-content * {
                        visibility: visible;
                    }

                    /* 3. Position receipt at top-left of the page */
                    #receipt-content {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        padding: 20px;
                        margin: 0;
                        
                        /* 4. Reset constraints that might cause clipping */
                        max-width: none !important;
                        max-height: none !important;
                        overflow: visible !important;
                        
                        /* 5. styling for print */
                        background: white !important;
                        color: black !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        transform: none !important;
                        z-index: 9999;
                        display: block !important;
                    }

                    /* 6. Force text colors to black */
                    #receipt-content .text-white, 
                    #receipt-content .text-gray-400,
                    #receipt-content .text-blue-400,
                    #receipt-content .text-emerald-400 {
                        color: black !important;
                    }

                    /* 7. Hide background elements/borders */
                    #receipt-content .glass,
                    #receipt-content .bg-white\\/5 {
                        background: transparent !important;
                        border: 1px solid #ddd !important;
                    }

                    /* 8. Hide unwanted buttons */
                    .no-print {
                        display: none !important;
                    }

                    /* 9. Ensure body doesn't scroll/clip */
                    html, body {
                        height: 100vh !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    
                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>
        </main >
    );
}
