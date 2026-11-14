import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  if (!process.env.STRIPE_SECRET_KEY) {
    return corsResponse({ error: "Stripe not configured" }, { status: 500 }, origin);
  }

  const { session_id } = (await req.json().catch(() => ({}))) as { session_id?: string };
  if (!session_id) {
    return corsResponse({ error: "Missing session_id" }, { status: 400 }, origin);
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return corsResponse({ error: "Payment not completed" }, { status: 402 }, origin);
    }

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

    // Verify the charged amount matches
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

    const result = await fulfillVerifiedOrder({
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
    console.error("Stripe verify error:", error);
    return corsResponse({ error: "Failed to verify payment" }, { status: 500 }, origin);
  }
}
