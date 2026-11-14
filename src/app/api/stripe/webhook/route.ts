import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

// Stripe requires the raw request body for signature verification.
export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return corsResponse({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 }, origin);
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return corsResponse({ error: "Stripe not configured" }, { status: 500 }, origin);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return corsResponse({ error: "Missing stripe-signature header" }, { status: 400 }, origin);
  }

  const rawBody = await req.text();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return corsResponse({ error: "Invalid stripe signature" }, { status: 400 }, origin);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = (session.metadata ?? {}) as Record<string, string>;
      const productId = metadata.productId ?? "";
      if (!productId) {
        return corsResponse({ error: "Session has no associated product" }, { status: 400 }, origin);
      }

      const db = getDb();
      const productSnap = await db.collection("products").doc(productId).get();
      if (!productSnap.exists) {
        return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
      }
      const product = productSnap.data() as { price?: number } | undefined;
      const usdPrice = typeof product?.price === "number" ? product.price : 0;

      const unitAmount = await usdToMinorUnits(usdPrice, session.currency?.toUpperCase() ?? "USD");

      const chargedAmount = session.amount_total ?? 0;
      if (chargedAmount !== unitAmount) {
        return corsResponse(
          { error: "Charged amount does not match product price" },
          { status: 400 },
          origin
        );
      }

      const customerEmail = session.customer_details?.email ?? session.customer_email ?? "";
      const customerName = session.customer_details?.name ?? "";

      await fulfillVerifiedOrder({
        gateway: "stripe",
        orderId: session.id,
        paymentId: session.payment_intent as string,
        productId,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          contact: "",
        },
        amount: unitAmount / 100,
        currency: (session.currency ?? "usd").toUpperCase(),
      });
    }

    return corsResponse({ received: true }, {}, origin);
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return corsResponse({ error: "Webhook handler failed" }, { status: 500 }, origin);
  }
}
