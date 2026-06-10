"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
    CaretLeft,
    X,
    ArrowRight,
    BookOpen,
    CircleNotch,
    ArrowSquareOut,
    Check,
    Copy,
    Terminal,
} from "@phosphor-icons/react";
import { getProductById, Product } from "@/lib/products";
import { generateLicense } from "@/lib/licenses";
import { addDoc, collection, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPaymentSettings, PaymentGateway } from "@/lib/paymentSettings";
import { useCurrency } from "@/components/CurrencyProvider";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

function CodeBlock({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const codeText = String(children || "").replace(/\n$/, "");
    const lang = className?.replace("language-", "") || "";

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(codeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [codeText]);

    return (
        <div className="group relative rounded-2xl border border-border bg-secondary/80 mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-foreground/[0.02]">
                <div className="flex items-center gap-1.5">
                    <Terminal size={12} className="text-muted-foreground/40" />
                    <span className="text-[10px] font-mono font-medium text-muted-foreground/50 uppercase tracking-wider">
                        {lang || "code"}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                >
                    {copied ? (
                        <><Check size={11} className="text-emerald-500" /> Copied</>
                    ) : (
                        <><Copy size={11} /> Copy</>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[13px] font-mono text-foreground/80 leading-relaxed">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-[22px] font-bold text-foreground tracking-tight mt-10 mb-3 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-[18px] font-bold text-foreground tracking-tight mt-8 mb-2 first:mt-0 border-b border-border/40 pb-1.5">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-[15px] font-bold text-foreground mt-6 mb-1.5">{children}</h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-[14px] font-semibold text-foreground mt-5 mb-1">{children}</h4>
    ),
    p: ({ children }) => (
        <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="space-y-1.5 mb-4">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="space-y-1.5 mb-4 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children, className }) => {
        const isTaskItem = className?.includes("task-list-item");
        if (isTaskItem) {
            return <li className="text-[14px] text-muted-foreground leading-relaxed mb-1 flex items-start gap-2">{children}</li>;
        }
        return (
            <li className="text-[14px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                <span>{children}</span>
            </li>
        );
    },
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground/80">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-muted-foreground/80">{children}</em>
    ),
    code: ({ className, children, ...props }) => {
        const isInline = !className;
        if (isInline) {
            return (
                <code className="px-1.5 py-0.5 rounded-md bg-foreground/[0.06] text-[13px] font-mono text-foreground/80 border border-border/50">
                    {children}
                </code>
            );
        }
        return null;
    },
    pre: ({ children }) => {
        const codeEl = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
        return <CodeBlock className={codeEl?.props?.className} children={codeEl?.props?.children} />;
    },
    hr: () => <hr className="border-border/60 my-8" />,
    blockquote: ({ children }) => (
        <blockquote className="border-l-[3px] border-accent/30 pl-5 text-muted-foreground/70 italic my-6 bg-accent/[0.03] py-3 pr-4 rounded-r-xl">
            {children}
        </blockquote>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/80 transition-colors"
        >
            {children}
        </a>
    ),
    img: ({ src, alt }) => (
        <span className="block my-6">
            <img
                src={src}
                alt={alt || ""}
                className="max-w-full h-auto rounded-xl border border-border"
                loading="lazy"
            />
            {alt && (
                <span className="block text-center text-[12px] text-muted-foreground/50 mt-2 italic">{alt}</span>
            )}
        </span>
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto my-6 rounded-xl border border-border">
            <table className="w-full text-left text-[14px]">{children}</table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-foreground/[0.03] border-b border-border">{children}</thead>
    ),
    tbody: ({ children }) => (
        <tbody>{children}</tbody>
    ),
    tr: ({ children }) => (
        <tr className="border-b border-border/50 last:border-0">{children}</tr>
    ),
    th: ({ children }) => (
        <th className="px-4 py-3 font-bold text-foreground/80 text-[12px] uppercase tracking-[0.06em]">{children}</th>
    ),
    td: ({ children }) => (
        <td className="px-4 py-3 text-muted-foreground">{children}</td>
    ),
    input: ({ checked }) => (
        <span className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 mt-0.5 ${
            checked
                ? "bg-accent border-accent text-white"
                : "border-border bg-transparent"
        }`}>
            {checked && <Check size={10} weight="bold" />}
        </span>
    ),
};

function looksLikeMarkdown(text: string): boolean {
    return /(^|\n)(#{1,6}\s|[-*+]\s|\d+\.\s|```|>\s|\|.+\||\[.+\]\(.+\))/.test(text)
        || /\*\*.*?\*\*|`[^`]+`|(\s|^)[-*+]\s/.test(text)
        || /^[\u{1F300}-\u{1FAFF}]|^[\u{2700}-\u{27BF}]|^★/u.test(text.trim());
}

function ProductDescription({ content, type }: { content: string; type: "plain" | "markdown" | "html" }) {
    if (type === "html") {
        return (
            <div
                className="prose prose-sm max-w-none text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground/80 [&_a]:text-accent"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    if (type === "markdown" || looksLikeMarkdown(content)) {
        return (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
            </ReactMarkdown>
        );
    }

    return (
        <div className="space-y-4">
            {content.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return i > 0 ? <div key={i} className="h-3" /> : null;
                }
                return (
                    <p key={i} className="text-[15px] text-muted-foreground leading-relaxed">
                        {trimmed}
                    </p>
                );
            })}
        </div>
    );
}

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

    const siteSettings = useSiteSettings();
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
            name: siteSettings.productDetail.merchantName,
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

                    {/* ── LEFT: Image + Description ── */}
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

                        {product.longDescription && (
                            <div className="mt-12">
                                <p className="text-label mb-5">Overview</p>
                                <div
                                    className="rounded-2xl border border-border p-6 sm:p-8"
                                    style={{
                                        background: "hsla(var(--card) / 0.5)",
                                        backdropFilter: "blur(20px) saturate(180%)",
                                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    }}
                                >
                                    <ProductDescription
                                        content={product.longDescription}
                                        type={product.descriptionType ?? "plain"}
                                    />
                                </div>
                            </div>
                        )}
                        {!product.longDescription && product.description && (
                            <div className="mt-10">
                                <div
                                    className="rounded-2xl border border-border p-6 sm:p-8"
                                    style={{
                                        background: "hsla(var(--card) / 0.5)",
                                        backdropFilter: "blur(20px) saturate(180%)",
                                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    }}
                                >
                                    <ProductDescription
                                        content={product.description}
                                        type={product.descriptionType ?? "plain"}
                                    />
                                </div>
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
                            {product.longDescription && (
                                <div className="mt-3 text-[14px] text-muted-foreground leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h1]:text-[18px] [&_h2]:text-[16px] [&_h3]:text-[14px] [&_ul]:space-y-0.5 [&_code]:text-[12px]">
                                    <ProductDescription
                                        content={product.description}
                                        type={product.descriptionType ?? "plain"}
                                    />
                                </div>
                            )}
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
                                {siteSettings.productDetail.acquireLabel}
                            </button>
                            {product.demoUrl ? (
                                <Link
                                    href={product.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full btn-apple btn-apple-secondary py-3.5 text-[14px] flex items-center justify-center gap-2"
                                >
                                    <ArrowSquareOut size={15} weight="bold" /> {siteSettings.productDetail.livePreviewLabel}
                                </Link>
                            ) : (
                                <button disabled className="w-full btn-apple bg-secondary/50 border border-border text-muted-foreground/40 cursor-not-allowed py-3.5 text-[14px]">
                                    {siteSettings.productDetail.noDemoLabel}
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
                                {siteSettings.productDetail.documentationLabel}
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
                                        <h2 className="text-[22px] font-bold text-foreground tracking-tight">{siteSettings.productDetail.checkoutLabel}</h2>
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
