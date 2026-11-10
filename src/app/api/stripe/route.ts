import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { getPaymentSettings } from "@/lib/paymentSettings";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured", code: "gateway_not_configured" }, { status: 503 });
  }

  // Server-side gateway enforcement: only accept Stripe sessions when it is
  // the active gateway in settings/payment.
  const settings = await getPaymentSettings().catch(() => ({ gateway: "razorpay" as const }));
  if (settings.gateway !== "stripe") {
    return NextResponse.json(
      { error: "Stripe is not the active gateway", code: "gateway_not_configured" },
      { status: 503 }
    );
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const { productId, productName, currency, customerName, customerEmail, customerContact } = await req.json();

    const currencyCode = (currency as string).toUpperCase();
    if (typeof productId !== "string" || !productId || !currencyCode) {
      return NextResponse.json({ error: "Missing productId or currency" }, { status: 400 });
    }

    // Server-side price authority: look up the product and compute the
    // chargeable amount from its USD price. The client's amount is never
    // trusted.
    const db = getDb();
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productSnap.data() as { price?: number; name?: string } | undefined;
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const usdPrice = typeof product.price === "number" ? product.price : 0;
    if (usdPrice <= 0) {
      return NextResponse.json({ error: "Product has no price" }, { status: 400 });
    }

    const unitAmount = await usdToMinorUnits(usdPrice, currencyCode);
    const productNameResolved = productName ?? product.name ?? productId;

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
      success_url: `${origin}/orders?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/products`,
      metadata: {
        productId,
        productName: productNameResolved,
        customerName: customerName ?? "",
        customerEmail: customerEmail ?? "",
        customerContact: customerContact ?? "",
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe session error:", error);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
