import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { verifyRazorpaySignature } from "@/lib/razorpaySig";
import { fulfillVerifiedOrder } from "@/lib/server/fulfill";

function cleanCustomerInfo(value: unknown) {
    if (!value || typeof value !== "object") return {};
    const { name, email, contact } = value as Record<string, unknown>;
    return {
        name: typeof name === "string" ? name.slice(0, 200) : undefined,
        email: typeof email === "string" ? email.slice(0, 200) : undefined,
        contact: typeof contact === "string" ? contact.slice(0, 40) : undefined,
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, paymentId, signature, customerInfo } = body ?? {};

        if (!orderId || !paymentId || !signature) {
            return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
        }
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
        }

        if (!verifyRazorpaySignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // Pull the authoritative amount/currency + product from the created order.
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        let amount: number;
        let currency: string;
        let productId: string;
        try {
            const order = await razorpay.orders.fetch(orderId);
            amount = (Number(order.amount) || 0) / 100;
            currency = (order.currency || "INR").toUpperCase();
            productId = typeof order.receipt === "string" ? order.receipt : "";
        } catch {
            return NextResponse.json({ error: "Failed to load payment order" }, { status: 500 });
        }

        if (!productId) {
            return NextResponse.json({ error: "Order has no associated product" }, { status: 400 });
        }

        const result = await fulfillVerifiedOrder({
            gateway: "razorpay",
            orderId,
            paymentId,
            productId,
            customerInfo: cleanCustomerInfo(customerInfo),
            amount,
            currency,
        });

        return NextResponse.json({
            verified: true,
            orderId: result.orderId,
            licenseKey: result.licenseKey,
        });
    } catch (error) {
        console.error("Razorpay verify error:", error);
        return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }
}