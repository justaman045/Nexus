"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Download, ShoppingCart, X, ArrowRight, ExternalLink } from "lucide-react";
import { getProductById, Product } from "@/lib/products";
import { addDoc, collection, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProductDetailsPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // Currency State
    const [currency, setCurrency] = useState<"USD" | "INR">("USD");
    const [displayPrice, setDisplayPrice] = useState<number>(0);
    const EXCHANGE_RATE = 85;

    useEffect(() => {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log("Detected Timezone:", userTimezone); // Debugging
        if (userTimezone === "Asia/Kolkata" || userTimezone === "Asia/Calcutta" || userTimezone.includes("India")) {
            setCurrency("INR");
        }
    }, []);

    useEffect(() => {
        if (id) {
            getProductById(id as string).then((p) => {
                setProduct(p);
                if (p) {
                    if (currency === "INR") {
                        setDisplayPrice(p.price * EXCHANGE_RATE);
                    } else {
                        setDisplayPrice(p.price);
                    }
                }
                setLoading(false);
            });
        }
    }, [id, currency]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [userDetails, setUserDetails] = useState({
        name: "",
        email: "",
        contact: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            getProductById(id as string).then((p) => {
                setProduct(p);
                setLoading(false);
            });
        }
    }, [id]);

    const loadScript = (src: string) => {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBuyClick = () => {
        setShowPaymentModal(true);
    };

    const processPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            setIsProcessing(false);
            return;
        }

        try {
            // Create Order on Server
            const response = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: displayPrice, currency: currency }),
            });
            const order = await response.json();

            if (order.error) {
                alert("Server Error: " + order.error);
                setIsProcessing(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Nexus Software",
                description: product!.name,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Save Order to Firestore
                        await addDoc(collection(db, "orders"), {
                            orderId: order.id,
                            paymentId: response.razorpay_payment_id,
                            productId: product!.id,
                            productName: product!.name,
                            amount: displayPrice,
                            currency: order.currency,
                            status: "paid",
                            customerInfo: userDetails,
                            createdAt: new Date().toISOString(),
                        });

                        // Increment Product Purchase Count
                        const productRef = doc(db, "products", product!.id);
                        await updateDoc(productRef, {
                            purchases: increment(1)
                        });

                        alert(`Payment Successful! Order ID: ${order.id}`);
                        setShowPaymentModal(false);
                        // Reset form
                        setUserDetails({ name: "", email: "", contact: "" });
                    } catch (error) {
                        console.error("Failed to save order", error);
                        alert("Payment successful but failed to record order. Please contact support.");
                    }
                },
                prefill: {
                    name: userDetails.name,
                    email: userDetails.email,
                    contact: userDetails.contact.replace(/\D/g, ""), // Remove non-digits (spaces, +, etc) to ensure Razorpay accepts it
                },
                theme: {
                    color: "#2563EB",
                },
            };

            const paymentObject = new (window as unknown as { Razorpay: new (options: any) => any }).Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error("Payment processing error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
                <Link href="/products" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Products
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/products" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Products
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Product Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl overflow-hidden glass border border-white/10 shadow-2xl"
                    >
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                    </motion.div>

                    {/* Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                                    {product.category}
                                </span>
                                <span className="text-3xl font-bold text-white">
                                    {currency === "USD" ? "$" : "₹"}{displayPrice.toLocaleString()}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {product.name}
                            </h1>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                {product.longDescription || product.description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white">Key Features</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {product.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2 text-gray-300">
                                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
                            <button
                                onClick={handleBuyClick}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" /> Buy Now
                            </button>
                            {product.demoUrl ? (
                                <Link
                                    href={product.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 glass hover:bg-white/10 text-white font-bold py-4 px-8 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" /> View Demo
                                </Link>
                            ) : (
                                <button disabled className="flex-1 glass opacity-50 cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl border border-white/10 flex items-center justify-center gap-2">
                                    <Download className="w-5 h-5" /> Demo Unavailable
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            Secure payment processed via Razorpay. Value Added Tax may apply.
                        </p>
                    </motion.div>
                </div>

                {/* Payment Modal */}
                <AnimatePresence>
                    {showPaymentModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                                onClick={() => !isProcessing && setShowPaymentModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                            >
                                <div className="glass w-full max-w-md rounded-2xl border border-white/10 pointer-events-auto shadow-2xl p-6 relative">
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        disabled={isProcessing}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-50"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>

                                    <h2 className="text-xl font-bold text-white mb-6">Enter Your Details</h2>
                                    <form onSubmit={processPayment} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={userDetails.name}
                                                onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="John Doe"
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                value={userDetails.email}
                                                onChange={e => setUserDetails({ ...userDetails, email: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="john@example.com"
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                                            <input
                                                required
                                                type="tel"
                                                value={userDetails.contact}
                                                onChange={e => setUserDetails({ ...userDetails, contact: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="+91 9999999999"
                                                disabled={isProcessing}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                        >
                                            {isProcessing ? "Processing..." : "Proceed to Pay"}
                                            {!isProcessing && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
