import Razorpay from "razorpay";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { getPaymentSettings } from "@/lib/paymentSettings";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "razorpay:create", limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return corsResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      origin
    );
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return corsResponse(
      { error: "Razorpay is not configured", code: "gateway_not_configured" },
      { status: 503 },
      origin
    );
  }

  const settings = await getPaymentSettings().catch(() => ({ gateway: "razorpay" as const }));
  if (settings.gateway !== "razorpay") {
    return corsResponse(
      { error: "Razorpay is not the active gateway", code: "gateway_not_configured" },
      { status: 503 },
      origin
    );
  }

  try {
    const { productId } = await req.json();

    if (typeof productId !== "string" || !productId) {
      return corsResponse({ error: "Missing productId" }, { status: 400 }, origin);
    }

    const db = getDb();
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }
    const product = productSnap.data() as { price?: number; name?: string; status?: string } | undefined;
    if (!product) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }
    // Only live products are purchasable (drafts/archived are hidden).
    if ((product.status ?? "draft") !== "live") {
      return corsResponse({ error: "Product is not available" }, { status: 404 }, origin);
    }
    const usdPrice = typeof product.price === "number" ? product.price : 0;
    if (!Number.isFinite(usdPrice) || usdPrice <= 0) {
      // A zero-priced product is free — there is nothing to charge for. The
      // client renders "Free" and never opens a checkout for it; this guard
      // makes sure a hand-crafted request cannot create a zero-amount order.
      return corsResponse(
        { error: "This product is free — no payment is required." },
        { status: 400 },
        origin
      );
    }

    const amountPaise = await usdToMinorUnits(usdPrice, "INR");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: amountPaise.toString(),
      currency: "INR",
      receipt: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      notes: { productId },
    };

    const response = await razorpay.orders.create(options);

    return corsResponse(
      {
        id: response.id,
        currency: response.currency,
        amount: response.amount,
      },
      {},
      origin
    );
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return corsResponse({ error: "Error creating order" }, { status: 500 }, origin);
  }
}
