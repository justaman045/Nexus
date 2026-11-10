import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { getDb, getServerTimestamp } from "./firebase";

export interface FulfillmentInput {
    gateway: "razorpay" | "stripe";
    /** Gateway reference id: Razorpay order id or Stripe Checkout Session id. */
    orderId: string;
    /** Payment id: Razorpay payment id or Stripe PaymentIntent id. Stored for reference. */
    paymentId: string;
    productId: string;
    productName?: string;
    customerInfo?: { name?: string; email?: string; contact?: string };
    amount: number;
    currency: string;
}

export interface FulfillmentResult {
    /** Firestore doc id of the stored order. */
    orderId: string;
    licenseKey: string;
}

function makeLicenseKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const segment = () =>
        Array.from(randomBytes(4), (b) => chars[b % chars.length]).join("");
    return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

function orderDocId(gateway: string, orderId: string): string {
    // Deterministic document id so the same payment can never create two orders.
    return `${gateway}_${orderId}`;
}

/**
 * Server-authoritative fulfillment: writes the paid order + license and
 * bumps `purchases`. Idempotent — a repeated call for the same
 * `gateway`+`orderId` returns the existing order instead of creating a
 * duplicate, using a Firestore transaction so concurrent calls cannot both
 * create.
 */
export async function fulfillVerifiedOrder(input: FulfillmentInput): Promise<FulfillmentResult> {
    const db = getDb();
    const orderRef = db.collection("orders").doc(orderDocId(input.gateway, input.orderId));
    const licenseRef = db.collection("licenses").doc(`lic_${input.gateway}_${input.orderId}`);

    const result = await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (orderSnap.exists) {
            const existing = orderSnap.data() as { licenseKey?: string } | undefined;
            const existingLicenseKey = existing?.licenseKey;
            if (existingLicenseKey) {
                return { orderId: orderRef.id, licenseKey: existingLicenseKey, created: false };
            }
            // Order exists but license is missing (shouldn't happen) — create it.
            const freshKey = makeLicenseKey();
            tx.set(licenseRef, {
                licenseKey: freshKey,
                productId: input.productId,
                productName: input.productName ?? "",
                customerEmail: input.customerInfo?.email ?? "",
                orderId: input.orderId,
                status: "active",
                createdAt: getServerTimestamp(),
            });
            return { orderId: orderRef.id, licenseKey: freshKey, created: false };
        }

        // First time: write order, license, and bump purchases.
        let productName = input.productName ?? "";
        try {
            const productSnap = await tx.get(db.collection("products").doc(input.productId));
            if (productSnap.exists) {
                productName = (productSnap.data()?.name as string) ?? productName;
            }
        } catch {
            // Non-fatal — fall back to whatever caller provided.
        }

        tx.set(orderRef, {
            orderId: input.orderId,
            paymentId: input.paymentId,
            productId: input.productId,
            productName,
            customerInfo: input.customerInfo ?? {},
            amount: input.amount,
            currency: input.currency,
            gateway: input.gateway,
            status: "paid",
            createdAt: getServerTimestamp(),
        });

        const licenseKey = makeLicenseKey();
        tx.set(licenseRef, {
            licenseKey,
            productId: input.productId,
            productName,
            customerEmail: input.customerInfo?.email ?? "",
            orderId: input.orderId,
            status: "active",
            createdAt: getServerTimestamp(),
        });

        tx.update(db.collection("products").doc(input.productId), {
            purchases: FieldValue.increment(1),
        });

        return { orderId: orderRef.id, licenseKey, created: true };
    });

    return { orderId: result.orderId, licenseKey: result.licenseKey };
}
