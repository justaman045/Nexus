
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import shortid from "shortid";

export async function POST(req: Request) {
    if (req.method !== "POST") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { amount, currency } = await req.json();

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Create options
        const options = {
            amount: Math.round(amount * 100).toString(), // Amount in smallest currency unit, rounded to avoid float issues
            currency,
            receipt: shortid.generate(),
        };

        // Create order
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
