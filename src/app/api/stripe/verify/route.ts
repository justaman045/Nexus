import { NextResponse } from "next/server";
import Stripe from "stripe";
import { gatewayMinorMultiplier } from "@/lib/currency";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";

export async function GET(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const metadata = (session.metadata ?? {}) as Record<string, string>;
    const productId = metadata.productId ?? "";
    if (!productId) {
      return NextResponse.json({ error: "Session has no associated product" }, { status: 400 });
    }

    const currency = (session.currency ?? "usd").toUpperCase();
    const amount = (session.amount_total ?? 0) / gatewayMinorMultiplier(currency);

    const result = await fulfillVerifiedOrder({
      gateway: "stripe",
      orderId: sessionId,
      paymentId: (session.payment_intent as string) ?? `pi_${sessionId}`,
      productId,
      customerInfo: {
        name: metadata.customerName,
        email: session.customer_email ?? metadata.customerEmail,
        contact: metadata.customerContact,
      },
      amount,
      currency,
    });

    return NextResponse.json({
      paymentId: (session.payment_intent as string) ?? `pi_${sessionId}`,
      amount,
      currency,
      metadata,
      customerEmail: session.customer_email ?? null,
      orderId: result.orderId,
      licenseKey: result.licenseKey,
    });
  } catch (error) {
    console.error("Stripe verify error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}