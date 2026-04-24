"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    CaretLeft,
    X,
    ArrowRight,
    BookOpen,
    CircleNotch,
    ArrowSquareOut,
    Check,
} from "@phosphor-icons/react";
import { getProductById, Product } from "@/lib/products";
import { generateLicense } from "@/lib/licenses";
import { addDoc, collection, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPaymentSettings, PaymentGateway } from "@/lib/paymentSettings";
import { useCurrency } from "@/components/CurrencyProvider";

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof (window as any).Razorpay !== "undefined") { resolve(true); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function ProductDetailsPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userDetails, setUserDetails] = useState({ name: "", email: "", contact: "" });

    const [gateway, setGateway] = useState<PaymentGateway>("razorpay");
    const { currency, rate: exchangeRate, format: formatCurrency, convert } = useCurrency();

    useEffect(() => {
        if (!id) return;
        Promise.all([
            getProductById(id as string),
            getPaymentSettings(),
        ]).then(([p, settings]) => {
            setProduct(p);
            setGateway(settings.gateway);
            setIsLoading(false);
        });
    }, [id]);

    const processRazorpay = async () => {
        const loaded = await loadRazorpayScript();
        if (!loaded) { alert("Failed to load payment gateway."); return; }

        const res = await fetch("/api/razorpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: convert(product!.price),
                currency: currency.code,
            }),
        });
        const order = await res.json();

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "Nexus SaaS",
            description: `License for ${product!.name}`,
            order_id: order.id,
            handler: async function (response: any) {
                try {
                    await addDoc(collection(db, "orders"), {
                        orderId: order.id,
                        paymentId: response.razorpay_payment_id,
                        productId: product!.id,
                        productName: product!.name,
                        customerInfo: userDetails,
                        amount: product!.price,
                        currency: currency.code,
                        gateway: "razorpay",
                        status: "paid",
                        createdAt: new Date().toISOString(),
                    });
                    await updateDoc(doc(db, "products", product!.id), { purchases: increment(1) });
                    const { licenseKey } = await generateLicense({
                        productId: product!.id,
                        productName: product!.name,
                        customerEmail: userDetails.email,
                        orderId: order.id,
                    });
                    alert(`Payment Successful!\n\nYour License Key: ${licenseKey}\n\nFind it anytime in your dashboard.`);
                    setShowPaymentModal(false);
                    setUserDetails({ name: "", email: "", contact: "" });
                } catch {
                    alert("Payment succeeded but order save failed. Contact support.");
                }
            },
            prefill: { name: userDetails.name, email: userDetails.email, contact: userDetails.contact },
            theme: { color: "#000000" },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    };

    const processStripe = async () => {
        const res = await fetch("/api/stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: convert(product!.price),
                currency: currency.code,
                productId: product!.id,
                productName: product!.name,
                customerName: userDetails.name,
                customerEmail: userDetails.email,
                customerContact: userDetails.contact,
            }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
            alert(data.error || "Failed to initiate Stripe checkout.");
            return;
        }
        // Save pending info to sessionStorage so orders page can save after redirect
        sessionStorage.setItem("stripe_pending", JSON.stringify({
            productId: product!.id,
            productName: product!.name,
            amount: product!.price,
            currency: currency.code,
            customerInfo: userDetails,
        }));
        window.location.href = data.url;
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            if (gateway === "stripe") {
                await processStripe();
            } else {
                await processRazorpay();
            }
        } catch {
            alert("Failed to initiate payment. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <CircleNotch className="w-8 h-8 text-foreground animate-spin opacity-20" weight="bold" />
            </div>
        );
    }

    const displayPrice = formatCurrency(product.price);

    return (
        <div className="min-h-screen bg-background">
            <div className="container-pro px-6 sm:px-8 lg:px-12 pb-32">

                {/* Breadcrumb */}
                <nav className="py-8">
                    <Link href="/products" className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors tracking-[0.08em] uppercase group">
                        <CaretLeft size={12} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Products
                    </Link>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 xl:gap-24 items-start">

                    {/* ── LEFT: Image ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="rounded-[28px] overflow-hidden bg-muted border border-border aspect-[4/3] relative group">
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-[2s] ease-out"
                            />
                        </div>

                        {(product.longDescription || product.description) && (
                            <div className="mt-10 space-y-6">
                                {(product.longDescription || product.description).split('\n\n').map((para, pIdx) => {
                                    const isFeatureList = para.includes('✅') || para.includes('❌') || para.includes('💎');
                                    if (isFeatureList) {
                                        return (
                                            <div key={pIdx} className="card-pro p-6 space-y-3">
                                                {para.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                                                    <div key={lIdx} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                                                        <span className="flex-shrink-0 text-foreground/60 mt-0.5">{line.trim().match(/^[^\w\s]/)?.[0] || '•'}</span>
                                                        <span>{line.replace(/^[^\w\s]/, '').trim()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={pIdx} className="space-y-1">
                                            {para.split('\n').filter(l => l.trim()).map((line, lIdx) => {
                                                const hasEmojiHeader = /^[\uD800-\uDBFF][\uDC00-\uDFFF]|^[^\w\s]/.test(line.trim());
                                                if (hasEmojiHeader) {
                                                    const [emoji, ...rest] = line.trim().split(' ');
                                                    return (
                                                        <h4 key={lIdx} className="text-[15px] font-bold text-foreground flex items-center gap-2 pt-4 first:pt-0">
                                                            <span className="opacity-50">{emoji}</span>
                                                            {rest.join(' ')}
                                                        </h4>
                                                    );
                                                }
                                                return <p key={lIdx} className="text-[15px] text-muted-foreground leading-relaxed">{line}</p>;
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* ── RIGHT: Info panel ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="lg:sticky lg:top-28 space-y-6"
                    >
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.16em] uppercase bg-secondary border border-border text-foreground/70">
                                {product.category}
                            </span>
                            {product.version && (
                                <span className="text-[11px] font-mono text-muted-foreground/50 font-semibold uppercase tracking-widest">
                                    v{product.version}
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-[32px] sm:text-[38px] font-bold tracking-tight leading-[1.1] text-foreground">
                                {product.name}
                            </h1>
                            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <div className="py-4 border-y border-border flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">License Price</span>
                            <span className="text-[28px] font-mono font-bold text-foreground tracking-tight">
                                {displayPrice}
                            </span>
                        </div>

                        {product.features.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground">What's included</p>
                                <ul className="space-y-2">
                                    {product.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-[14px] text-foreground/80">
                                            <Check size={14} weight="bold" className="text-accent mt-0.5 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full btn-apple btn-apple-primary py-4 text-[14px] font-semibold"
                            >
                                Acquire License
                            </button>
                            {product.demoUrl ? (
                                <Link
                                    href={product.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full btn-apple btn-apple-secondary py-3.5 text-[14px] flex items-center justify-center gap-2"
                                >
                                    <ArrowSquareOut size={15} weight="bold" /> Live Preview
                                </Link>
                            ) : (
                                <button disabled className="w-full btn-apple bg-secondary/50 border border-border text-muted-foreground/40 cursor-not-allowed py-3.5 text-[14px]">
                                    No Demo Available
                                </button>
                            )}
                        </div>

                        {/* Gateway indicator */}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Powered by {gateway === "stripe" ? "Stripe" : "Razorpay"}
                        </div>

                        {product.documentationUrl && (
                            <Link
                                href={product.documentationUrl}
                                target="_blank"
                                className="flex items-center justify-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 group"
                            >
                                <BookOpen size={14} weight="bold" className="group-hover:scale-110 transition-transform" />
                                View Documentation
                            </Link>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── Payment Modal ── */}
            <AnimatePresence>
                {showPaymentModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[60]"
                            onClick={() => !isProcessing && setShowPaymentModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.98 }}
                            transition={{ type: "spring", damping: 28, stiffness: 240 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
                        >
                            <div className="bg-card w-full max-w-md rounded-[24px] border border-border pointer-events-auto shadow-2xl p-8 relative">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={isProcessing}
                                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={16} weight="bold" />
                                </button>

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-[22px] font-bold text-foreground tracking-tight">Checkout</h2>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground uppercase tracking-wider">
                                            via {gateway === "stripe" ? "Stripe" : "Razorpay"}
                                        </span>
                                    </div>
                                    <p className="text-[14px] text-muted-foreground">
                                        {product.name} — <span className="font-semibold text-foreground">{displayPrice}</span>
                                    </p>
                                </div>

                                {gateway === "stripe" && (
                                    <div className="mb-4 px-3 py-2.5 rounded-xl bg-[#635BFF]/[0.07] border border-[#635BFF]/20 text-[12px] text-muted-foreground">
                                        You'll be redirected to Stripe's secure checkout after filling this form.
                                    </div>
                                )}

                                <form onSubmit={handleCheckout} className="space-y-4">
                                    {[
                                        { label: "Full Name", key: "name", type: "text", placeholder: "Your name" },
                                        { label: "Email", key: "email", type: "email", placeholder: "your@email.com" },
                                        { label: "Phone", key: "contact", type: "tel", placeholder: "+1 (000) 000-0000" },
                                    ].map(({ label, key, type, placeholder }) => (
                                        <div key={key} className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</label>
                                            <input
                                                required
                                                type={type}
                                                value={userDetails[key as keyof typeof userDetails]}
                                                onChange={e => setUserDetails({ ...userDetails, [key]: e.target.value })}
                                                placeholder={placeholder}
                                                disabled={isProcessing}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="btn-apple btn-apple-primary w-full py-4 text-[14px] mt-2 disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <CircleNotch size={18} className="animate-spin" weight="bold" />
                                        ) : gateway === "stripe" ? (
                                            <>Continue to Stripe <ArrowRight size={16} weight="bold" /></>
                                        ) : (
                                            <>Pay & Get License <ArrowRight size={16} weight="bold" /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
