import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { getPaymentSettings } from "@/lib/paymentSettings";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  if (!process.env.STRIPE_SECRET_KEY) {
    return corsResponse({ error: "Stripe is not configured", code: "gateway_not_configured" }, { status: 503 }, origin);
  }

  const settings = await getPaymentSettings().catch(() => ({ gateway: "razorpay" as const }));
  if (settings.gateway !== "stripe") {
    return corsResponse(
      { error: "Stripe is not the active gateway", code: "gateway_not_configured" },
      { status: 503 },
      origin
    );
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const { productId, productName, currency, customerName, customerEmail, customerContact } = await req.json();

    const currencyCode = (currency as string).toUpperCase();
    if (typeof productId !== "string" || !productId || !currencyCode) {
      return corsResponse({ error: "Missing productId or currency" }, { status: 400 }, origin);
    }

    const db = getDb();
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }
    const product = productSnap.data() as { price?: number; name?: string } | undefined;
    if (!product) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }
    const usdPrice = typeof product.price === "number" ? product.price : 0;
    if (usdPrice <= 0) {
      return corsResponse({ error: "Product has no price" }, { status: 400 }, origin);
    }

    const unitAmount = await usdToMinorUnits(usdPrice, currencyCode);
    const productNameResolved = productName ?? product.name ?? productId;

    const stripeOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [{
        price_data: {
          currency: currencyCode.toLowerCase(),
          product_data: { name: productNameResolved },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${stripeOrigin}/orders?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${stripeOrigin}/products`,
      metadata: {
        productId,
        productName: productNameResolved,
        customerName: customerName ?? "",
        customerEmail: customerEmail ?? "",
        customerContact: customerContact ?? "",
      },
    });

    return corsResponse({ url: session.url, sessionId: session.id }, {}, origin);
  } catch (error) {
    console.error("Stripe session error:", error);
    return corsResponse({ error: "Failed to create payment session" }, { status: 500 }, origin);
  }
}
