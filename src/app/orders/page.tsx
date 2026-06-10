"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Package,
  ArrowRight,
  CircleNotch,
  X,
  Receipt,
  CalendarBlank,
  CheckCircle,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateLicense } from "@/lib/licenses";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

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
  gateway?: string;
  customerInfo?: {
    name: string;
    email: string;
    contact: string;
  };
}

interface StripeSuccessData {
  licenseKey: string;
  productName: string;
  email: string;
}

function OrderHistoryContent() {
  const siteSettings = useSiteSettings();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [stripeProcessing, setStripeProcessing] = useState(false);
  const [stripeSuccess, setStripeSuccess] = useState<StripeSuccessData | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleStripeReturn = useCallback(async (sessionId: string) => {
    setStripeProcessing(true);
    setStripeError(null);
    try {
      const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Get pending order info from sessionStorage
      const pending = JSON.parse(sessionStorage.getItem("stripe_pending") || "null");
      const productId = data.metadata?.productId || pending?.productId || "";
      const productName = data.metadata?.productName || pending?.productName || "Unknown Product";
      const customerName = data.metadata?.customerName || pending?.customerInfo?.name || "";
      const customerEmail = data.customerEmail || data.metadata?.customerEmail || pending?.customerInfo?.email || "";
      const customerContact = data.metadata?.customerContact || pending?.customerInfo?.contact || "";
      const amount = pending?.amount ?? data.amount;
      const currency = pending?.currency ?? data.currency;

      // Check if order already saved (idempotency)
      const existing = await getDocs(query(collection(db, "orders"), where("orderId", "==", sessionId)));
      let licenseKey: string;
      if (!existing.empty) {
        // Order already exists — fetch its license
        const existingLic = await getDocs(query(collection(db, "licenses"), where("orderId", "==", sessionId)));
        licenseKey = existingLic.empty ? "Check your dashboard" : existingLic.docs[0].data().licenseKey;
      } else {
        // Save new order
        await addDoc(collection(db, "orders"), {
          orderId: sessionId,
          paymentId: data.paymentId,
          productId,
          productName,
          customerInfo: { name: customerName, email: customerEmail, contact: customerContact },
          amount,
          currency,
          gateway: "stripe",
          status: "paid",
          createdAt: new Date().toISOString(),
        });
        if (productId) {
          await updateDoc(doc(db, "products", productId), { purchases: increment(1) }).catch(() => {});
        }
        const result = await generateLicense({ productId, productName, customerEmail, orderId: sessionId });
        licenseKey = result.licenseKey;
      }

      sessionStorage.removeItem("stripe_pending");
      setStripeSuccess({ licenseKey, productName, email: customerEmail });
      // Remove query param from URL
      router.replace("/orders", { scroll: false });
    } catch (err: any) {
      setStripeError(err.message || "Failed to process payment. Contact support.");
    } finally {
      setStripeProcessing(false);
    }
  }, [router]);

  useEffect(() => {
    const sessionId = searchParams.get("stripe_session_id");
    if (sessionId) handleStripeReturn(sessionId);
  }, [searchParams, handleStripeReturn]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setOrders([]);
    try {
      const q = query(collection(db, "orders"), where("customerInfo.email", "==", email.trim()));
      const snap = await getDocs(q);
      const found = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      found.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(found);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLicense = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      <div className="container-pro section-padding">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-label mb-4">{siteSettings.ordersPage.heading}</p>
          <h1 className="text-display gradient-text mb-5">{siteSettings.ordersPage.subheading}</h1>
          <p className="text-body-large text-muted-foreground max-w-[440px] mx-auto">
            {siteSettings.ordersPage.description}
          </p>
        </motion.div>

        {/* Stripe processing / success / error states */}
        <AnimatePresence>
          {stripeProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto mb-10 card-pro p-6 flex items-center gap-4"
            >
              <CircleNotch size={20} className="animate-spin text-accent shrink-0" />
              <div>
                <p className="text-[15px] font-semibold">Confirming your payment…</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Saving order & generating your license key.</p>
              </div>
            </motion.div>
          )}

          {stripeError && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto mb-10 card-pro p-6 border border-red-500/20"
            >
              <p className="text-[15px] font-semibold text-red-500">Payment verification failed</p>
              <p className="text-[13px] text-muted-foreground mt-1">{stripeError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSearch}
          className="max-w-md mx-auto mb-16"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="input-apple pl-11"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-pro btn-pro-primary px-6 shrink-0 disabled:opacity-40"
            >
              {isLoading ? <CircleNotch size={16} className="animate-spin" /> : "Track"}
            </button>
          </div>
        </motion.form>

        {/* Results */}
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {hasSearched && !isLoading && orders.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 space-y-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-foreground/[0.04] border border-border flex items-center justify-center mx-auto">
                  <Package size={24} weight="thin" className="text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium">No orders found for this email address.</p>
              </motion.div>
            )}

            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="card-pro p-6 flex items-center justify-between gap-6 group cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] border border-accent/[0.12] flex items-center justify-center">
                    <Package size={20} weight="regular" className="text-accent" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold">{order.productName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <CalendarBlank size={11} />
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        order.status === "paid"
                          ? "bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400/80 border-emerald-500/[0.15]"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {order.status}
                      </span>
                      {order.gateway && (
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{order.gateway}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[18px] font-bold font-mono text-muted-foreground/60">
                    {formatAmount(order.amount, order.currency)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-foreground/[0.05] flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Stripe Success Modal ── */}
      <AnimatePresence>
        {stripeSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="apple-card w-full max-w-md pointer-events-auto p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} weight="fill" className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-[22px] font-bold tracking-tight">Payment Successful!</h2>
                  <p className="text-[14px] text-muted-foreground mt-2">
                    Your license for <span className="font-semibold text-foreground">{stripeSuccess.productName}</span> is ready.
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-2xl p-5 space-y-2 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">License Key</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-[17px] font-mono font-bold tracking-widest text-foreground">
                      {stripeSuccess.licenseKey}
                    </code>
                    <button
                      onClick={() => copyLicense(stripeSuccess.licenseKey)}
                      className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      {copied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[12px] text-muted-foreground">Sent to {stripeSuccess.email}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStripeSuccess(null)}
                    className="btn-apple btn-apple-primary flex-1 py-3 text-[14px]"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => { setEmail(stripeSuccess.email); setStripeSuccess(null); }}
                    className="btn-apple btn-apple-secondary flex-1 py-3 text-[14px]"
                  >
                    View Orders
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div id="receipt-content" className="apple-card w-full max-w-md pointer-events-auto shadow-[0_32px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                <div className="flex justify-between items-center p-7 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/[0.08] flex items-center justify-center">
                      <Receipt size={18} weight="regular" className="text-accent" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold">Payment Receipt</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{selectedOrder.paymentId || "—"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="no-print w-9 h-9 rounded-full bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="p-7 space-y-6">
                  <div className="bg-secondary/50 rounded-2xl p-5 flex justify-between items-center">
                    <span className="text-muted-foreground text-[14px]">Amount Paid</span>
                    <span className="text-[24px] font-bold">{formatAmount(selectedOrder.amount, selectedOrder.currency)}</span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-label mb-3">Transaction Details</p>
                    {[
                      { label: "Product", value: selectedOrder.productName },
                      { label: "Status", value: selectedOrder.status.toUpperCase() },
                      { label: "Gateway", value: selectedOrder.gateway?.toUpperCase() || "—" },
                      { label: "Date", value: new Date(selectedOrder.createdAt).toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-muted-foreground text-[13px]">{label}</span>
                        <span className="text-[13px] font-medium">{value}</span>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.customerInfo && (
                    <div className="space-y-3 pt-4 border-t border-border">
                      <p className="text-label mb-3">Customer</p>
                      {[
                        { label: "Name", value: selectedOrder.customerInfo.name },
                        { label: "Email", value: selectedOrder.customerInfo.email },
                        { label: "Contact", value: selectedOrder.customerInfo.contact },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-muted-foreground text-[13px]">{label}</span>
                          <span className="text-[13px] font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="no-print p-7 border-t border-border">
                  <button
                    onClick={() => window.print()}
                    className="btn-pro btn-pro-primary w-full py-3 text-[13px]"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content {
            position: fixed; left: 0; top: 0;
            width: 100vw; padding: 20px; margin: 0;
            max-width: none !important; overflow: visible !important;
            background: white !important; color: black !important;
            border: none !important; box-shadow: none !important;
            border-radius: 0 !important; z-index: 9999;
          }
          .no-print { display: none !important; }
          html, body { height: 100vh !important; overflow: visible !important; background: white !important; }
          @page { margin: 0; size: auto; }
        }
      `}</style>
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <CircleNotch className="w-8 h-8 text-foreground animate-spin opacity-20" weight="bold" />
      </div>
    }>
      <OrderHistoryContent />
    </Suspense>
  );
}
