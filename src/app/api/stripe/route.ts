import { NextResponse } from "next/server";
import Stripe from "stripe";
import { gatewayMinorMultiplier } from "@/lib/currency";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local", code: "gateway_not_configured" }, { status: 503 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const { amount, currency, productId, productName, customerName, customerEmail, customerContact } = await req.json();

    const currencyCode = (currency as string).toUpperCase();
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || !currencyCode) {
      return NextResponse.json({ error: "Invalid amount or currency" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [{
        price_data: {
          currency: currencyCode.toLowerCase(),
          product_data: { name: productName },
          unit_amount: Math.round(amount * gatewayMinorMultiplier(currencyCode)),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/orders?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/products`,
      metadata: { productId, productName, customerName, customerEmail, customerContact },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe session error:", error);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
