import Razorpay from "razorpay";
import { verifyRazorpaySignature } from "@/lib/razorpaySig";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

function cleanCustomerInfo(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const { name, email, contact } = value as Record<string, unknown>;
  return {
    name: typeof name === "string" ? name.slice(0, 200) : undefined,
    email: typeof email === "string" ? email.slice(0, 200) : undefined,
    contact: typeof contact === "string" ? contact.slice(0, 40) : undefined,
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "razorpay:verify", limit: 30, windowMs: 60_000 });
  if (!limited.ok) {
    return corsResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      origin
    );
  }

  try {
    const body = await req.json();
    const { orderId, paymentId, signature, customerInfo } = body ?? {};

    if (!orderId || !paymentId || !signature) {
      return corsResponse({ error: "Missing payment details" }, { status: 400 }, origin);
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return corsResponse({ error: "Razorpay is not configured" }, { status: 500 }, origin);
    }

    if (!verifyRazorpaySignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
      return corsResponse({ error: "Invalid payment signature" }, { status: 400 }, origin);
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let order: { amount?: string | number; currency?: string; notes?: Record<string, unknown> };
    try {
      order = await razorpay.orders.fetch(orderId);
    } catch {
      return corsResponse({ error: "Failed to load payment order" }, { status: 500 }, origin);
    }

    let payment: { status?: string; amount?: string | number; currency?: string; order_id?: string };
    try {
      payment = await razorpay.payments.fetch(paymentId);
    } catch {
      return corsResponse({ error: "Failed to load payment" }, { status: 500 }, origin);
    }
    if (payment.status !== "captured") {
      return corsResponse({ error: "Payment not captured" }, { status: 400 }, origin);
    }
    if (payment.order_id !== orderId) {
      return corsResponse({ error: "Payment does not belong to this order" }, { status: 400 }, origin);
    }
    const chargedPaiseFromPayment =
      typeof payment.amount === "number" ? payment.amount : Number(payment.amount || 0);
    const orderPaise =
      typeof order.amount === "number" ? order.amount : Number(order.amount || 0);
    if (chargedPaiseFromPayment !== orderPaise) {
      return corsResponse({ error: "Captured amount does not match order" }, { status: 400 }, origin);
    }

    const productId = typeof order.notes?.productId === "string" ? order.notes.productId : "";
    if (!productId) {
      return corsResponse({ error: "Order has no associated product" }, { status: 400 }, origin);
    }

    const db = getDb();
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }
    const product = productSnap.data() as { price?: number } | undefined;
    const usdPrice = typeof product?.price === "number" ? product.price : 0;
    const expectedPaise = await usdToMinorUnits(usdPrice, "INR");

    const chargedPaise = typeof order.amount === "number" ? order.amount : Number(order.amount || 0);
    const chargedCurrency = (order.currency || "INR").toUpperCase();

    if (chargedPaise !== expectedPaise || chargedCurrency !== "INR") {
      return corsResponse(
        { error: "Charged amount does not match product price" },
        { status: 400 },
        origin
      );
    }

    const amount = chargedPaise / 100;
    const currency = chargedCurrency;

    const result = await fulfillVerifiedOrder({
      gateway: "razorpay",
      orderId,
      paymentId,
      productId,
      customerInfo: cleanCustomerInfo(customerInfo),
      amount,
      currency,
    });

    return corsResponse(
      {
        verified: true,
        orderId: result.orderId,
        licenseKey: result.licenseKey,
      },
      {},
      origin
    );
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return corsResponse({ error: "Failed to verify payment" }, { status: 500 }, origin);
  }
}
