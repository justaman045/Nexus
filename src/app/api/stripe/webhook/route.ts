import { NextResponse } from "next/server";
import Stripe from "stripe";
import { gatewayMinorMultiplier } from "@/lib/currency";
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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const productId = metadata.productId ?? "";

  if (!productId || session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "no product" });
  }

  const currency = (session.currency ?? "usd").toUpperCase();
  const amount = (session.amount_total ?? 0) / gatewayMinorMultiplier(currency);

  try {
    // Idempotent — repeated delivery for the same session reuses the stored order.
    await fulfillVerifiedOrder({
      gateway: "stripe",
      orderId: session.id,
      paymentId: (session.payment_intent as string) ?? `pi_${session.id}`,
      productId,
      customerInfo: {
        name: metadata.customerName ?? session.customer_details?.name,
        email: session.customer_email ?? metadata.customerEmail,
        contact: metadata.customerContact,
      },
      amount,
      currency,
    });
  } catch (err) {
    console.error("Stripe webhook fulfillment failed:", err);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}