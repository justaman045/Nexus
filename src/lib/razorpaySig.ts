import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Razorpay's payment signature (HMAC-SHA256 over "orderId|paymentId").
 * Constant-time comparison to avoid timing side channels.
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
    if (!orderId || !paymentId || !signature || !secret) return false;

    const expected = createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    const given = Buffer.from(String(signature), "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");

    return given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf);
}