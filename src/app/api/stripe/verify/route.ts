import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
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

    // Server-authoritative: recompute the expected amount from the product's
    // USD price and reject if the charged amount doesn't match.
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
      return NextResponse.json(
        { error: "Charged amount does not match product price" },
        { status: 400 }
      );
    }

    const currency = (session.currency ?? "usd").toUpperCase();
    const amount = chargedMinorUnits / 100;

    // Idempotency keyed on the Checkout Session id (identical in webhook and
    // verify paths), not on payment_intent which can differ between them.
    const result = await fulfillVerifiedOrder({
      gateway: "stripe",
      orderId: session.id,
      paymentId: typeof session.payment_intent === "string" ? session.payment_intent : `pi_${session.id}`,
      productId,
      customerInfo: {
        name: metadata.customerName ?? session.customer_details?.name ?? undefined,
        email: session.customer_email ?? metadata.customerEmail ?? undefined,
        contact: metadata.customerContact ?? undefined,
      },
      amount,
      currency,
    });

    // Don't return customer PII or the raw metadata — only what the client needs.
    return NextResponse.json({
      orderId: session.id,
      amount,
      currency,
      licenseKey: result.licenseKey,
    });
  } catch (error) {
    console.error("Stripe verify error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
