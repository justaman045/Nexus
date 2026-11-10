import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { verifyRazorpaySignature } from "@/lib/razorpaySig";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";

function cleanCustomerInfo(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const { name, email, contact } = value as Record<string, unknown>;
  return {
    name: typeof name === "string" ? name.slice(0, 200) : undefined,
    email: typeof email === "string" ? email.slice(0, 200) : undefined,
    contact: typeof contact === "string" ? contact.slice(0, 40) : undefined,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, customerInfo } = body ?? {};

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
    }

    if (!verifyRazorpaySignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let order: { amount?: string | number; currency?: string; notes?: Record<string, unknown> };
    try {
      order = await razorpay.orders.fetch(orderId);
    } catch {
      return NextResponse.json({ error: "Failed to load payment order" }, { status: 500 });
    }

    // Confirm the payment was actually captured (not just authorized) and that
    // the captured amount matches the order. Razorpay HMAC only proves the
    // signature is genuine — it doesn't prove capture.
    let payment: { status?: string; amount?: string | number; currency?: string; order_id?: string };
    try {
      payment = await razorpay.payments.fetch(paymentId);
    } catch {
      return NextResponse.json({ error: "Failed to load payment" }, { status: 500 });
    }
    if (payment.status !== "captured") {
      return NextResponse.json({ error: "Payment not captured" }, { status: 400 });
    }
    if (payment.order_id !== orderId) {
      return NextResponse.json({ error: "Payment does not belong to this order" }, { status: 400 });
    }
    const chargedPaiseFromPayment =
      typeof payment.amount === "number" ? payment.amount : Number(payment.amount || 0);
    const orderPaise =
      typeof order.amount === "number" ? order.amount : Number(order.amount || 0);
    if (chargedPaiseFromPayment !== orderPaise) {
      return NextResponse.json({ error: "Captured amount does not match order" }, { status: 400 });
    }

    // Read the real product id from notes, not from the (truncated) receipt.
    const productId = typeof order.notes?.productId === "string" ? order.notes.productId : "";
    if (!productId) {
      return NextResponse.json({ error: "Order has no associated product" }, { status: 400 });
    }

    // Recompute the expected amount server-side from the product's USD price.
    const db = getDb();
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productSnap.data() as { price?: number } | undefined;
    const usdPrice = typeof product?.price === "number" ? product.price : 0;
    const expectedPaise = await usdToMinorUnits(usdPrice, "INR");

    const chargedPaise = typeof order.amount === "number" ? order.amount : Number(order.amount || 0);
    const chargedCurrency = (order.currency || "INR").toUpperCase();

    // Server-authoritative: reject if the charged amount/currency doesn't match
    // what the product price dictates.
    if (chargedPaise !== expectedPaise || chargedCurrency !== "INR") {
      return NextResponse.json(
        { error: "Charged amount does not match product price" },
        { status: 400 }
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

    return NextResponse.json({
      verified: true,
      orderId: result.orderId,
      licenseKey: result.licenseKey,
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
