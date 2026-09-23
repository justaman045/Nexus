import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { getDb, getServerTimestamp } from "./firebase";

export interface FulfillmentInput {
    gateway: "razorpay" | "stripe";
    /** Gateway reference id: Razorpay order id or Stripe Checkout Session id. */
    orderId: string;
    /** Payment id: Razorpay payment id or Stripe PaymentIntent id. Unique per payment. */
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

async function findLicenseForOrder(orderId: string): Promise<string | null> {
    const db = getDb();
    const lic = await db.collection("licenses").where("orderId", "==", orderId).limit(1).get();
    if (lic.empty) return null;
    return lic.docs[0].data().licenseKey as string;
}

/**
 * Server-authoritative fulfillment: writes the paid order + license and
 * bumps `purchases`. Idempotent — a repeated call for the same `paymentId`
 * returns the existing order instead of creating a duplicate.
 */
export async function fulfillVerifiedOrder(input: FulfillmentInput): Promise<FulfillmentResult> {
    const db = getDb();

    const existing = await db
        .collection("orders")
        .where("paymentId", "==", input.paymentId)
        .limit(1)
        .get();
    if (!existing.empty) {
        const orderId = existing.docs[0].id;
        const licenseKey = await findLicenseForOrder(input.orderId);
        if (licenseKey) return { orderId, licenseKey };
        const fresh = makeLicenseKey();
        await db.collection("licenses").add({
            licenseKey: fresh,
            productId: input.productId,
            productName: input.productName ?? "",
            customerEmail: input.customerInfo?.email ?? "",
            orderId: input.orderId,
            status: "active",
            createdAt: getServerTimestamp(),
        });
        return { orderId, licenseKey: fresh };
    }

    let productName = input.productName ?? "";
    try {
        const productSnap = await db.collection("products").doc(input.productId).get();
        if (productSnap.exists) {
            productName = (productSnap.data()?.name as string) ?? productName;
        }
    } catch {
        // Non-fatal — fall back to whatever caller provided.
    }

    const orderRef = await db.collection("orders").add({
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
    await db.collection("licenses").add({
        licenseKey,
        productId: input.productId,
        productName,
        customerEmail: input.customerInfo?.email ?? "",
        orderId: input.orderId,
        status: "active",
        createdAt: getServerTimestamp(),
    });

    // Purchases reflects *verified* sales only now; failures can't patch the counter.
    await db
        .collection("products")
        .doc(input.productId)
        .update({ purchases: FieldValue.increment(1) })
        .catch(() => {});

    return { orderId: orderRef.id, licenseKey };
}