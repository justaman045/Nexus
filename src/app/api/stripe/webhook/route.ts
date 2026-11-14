import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits, gatewayMinorMultiplier } from "@/lib/server/currency";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";

export const dynamic = "force-dynamic";

// Stripe requires the raw request body for signature verification.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const productId = metadata.productId ?? "";

  if (!productId || session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "no product" });
  }

  // Server-authoritative: recompute the expected amount and reject mismatch.
  const db = getDb();
  const productSnap = await db.collection("products").doc(productId).get();
  if (!productSnap.exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const product = productSnap.data() as { price?: number } | undefined;
  const usdPrice = typeof product?.price === "number" ? product.price : 0;
  const expectedMinorUnits = await usdToMinorUnits(usdPrice, (session.currency ?? "usd").toUpperCase());

  const chargedMinorUnits = Number(session.amount_total ?? 0);
  if (chargedMinorUnits !== expectedMinorUnits) {
    // Log the mismatch but acknowledge receipt (200) so Stripe stops retrying.
    // Idempotency in fulfillVerifiedOrder prevents duplicate fulfillment.
    console.error("Stripe webhook amount mismatch", { sessionId: session.id, expected: expectedMinorUnits, charged: chargedMinorUnits });
    return NextResponse.json({ received: true, skipped: "amount_mismatch" });
  }

  try {
    // Idempotent — keyed on the Checkout Session id (identical in webhook and verify paths).
    await fulfillVerifiedOrder({
      gateway: "stripe",
      orderId: session.id,
      paymentId: typeof session.payment_intent === "string" ? session.payment_intent : `pi_${session.id}`,
      productId,
      customerInfo: {
        name: metadata.customerName ?? session.customer_details?.name ?? undefined,
        email: session.customer_email ?? metadata.customerEmail ?? undefined,
        contact: metadata.customerContact ?? undefined,
      },
      amount: chargedMinorUnits / gatewayMinorMultiplier((session.currency ?? "usd").toUpperCase()),
      currency: (session.currency ?? "usd").toUpperCase(),
    });
  } catch (err) {
    console.error("Stripe webhook fulfillment failed:", err);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
