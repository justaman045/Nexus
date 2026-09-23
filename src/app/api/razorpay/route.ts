import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        const { amount, currency, productId } = await req.json();

        if (currency !== "INR") {
            return NextResponse.json(
                { error: "Razorpay only supports payments in INR. Please switch currency or contact support." },
                { status: 400 }
            );
        }
        if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }
        if (typeof productId !== "string" || !productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const options = {
            amount: Math.round(amount * 100).toString(), // paise
            currency,
            // productId is readable back at verify time (receipt ≤ 40 chars)
            receipt: productId.slice(0, 40),
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