import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getDb } from "@/lib/server/firebase";
import { usdToMinorUnits } from "@/lib/server/currency";
import { getPaymentSettings } from "@/lib/paymentSettings";

export async function POST(req: Request) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay is not configured", code: "gateway_not_configured" },
      { status: 503 }
    );
  }

  // Server-side gateway enforcement: only accept Razorpay orders when it is
  // the active gateway in settings/payment.
  const settings = await getPaymentSettings().catch(() => ({ gateway: "razorpay" as const }));
  if (settings.gateway !== "razorpay") {
    return NextResponse.json(
      { error: "Razorpay is not the active gateway", code: "gateway_not_configured" },
      { status: 503 }
    );
  }

  try {
    const { productId } = await req.json();

    if (typeof productId !== "string" || !productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Server-side price authority: look up the product and compute the
    // chargeable INR amount from its USD price. The client's amount is
    // never trusted.
    const db = getDb();
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productSnap.data() as { price?: number; name?: string } | undefined;
    const usdPrice = typeof product?.price === "number" ? product.price : 0;
    if (usdPrice <= 0) {
      return NextResponse.json({ error: "Product has no price" }, { status: 400 });
    }

    const amountPaise = await usdToMinorUnits(usdPrice, "INR");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: amountPaise.toString(), // paise
      currency: "INR",
      // Carry the real product id in notes (≤256 chars). receipt stays a
      // short unique token so two products sharing a prefix can't collide.
      receipt: `ord_${Date.now()}`,
      notes: { productId },
    };

    const response = await razorpay.orders.create(options);

    return NextResponse.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}
