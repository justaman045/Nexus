import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { verifyRazorpaySignature } from "./razorpaySig";

describe("verifyRazorpaySignature", () => {
  const secret = "s3cr3t-key";
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  function sign(o: string, p: string): string {
    return createHmac("sha256", secret).update(`${o}|${p}`).digest("hex");
  }

  it("accepts a valid signature", () => {
    expect(verifyRazorpaySignature(orderId, paymentId, sign(orderId, paymentId), secret)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const sig = sign(orderId, "pay_OTHER");
    expect(verifyRazorpaySignature(orderId, paymentId, sig, secret)).toBe(false);
  });

  it("rejects garbage signature strings", () => {
    expect(verifyRazorpaySignature(orderId, paymentId, "not-a-signature", secret)).toBe(false);
  });

  it("rejects when the payment id in the signature differs", () => {
    const sig = sign(orderId, "different_payment");
    expect(verifyRazorpaySignature(orderId, paymentId, sig, secret)).toBe(false);
  });

  it("rejects missing inputs", () => {
    expect(verifyRazorpaySignature("", paymentId, sign(orderId, paymentId), secret)).toBe(false);
    expect(verifyRazorpaySignature(orderId, "", sign(orderId, paymentId), secret)).toBe(false);
    expect(verifyRazorpaySignature(orderId, paymentId, "", secret)).toBe(false);
  });

  it("rejects an empty secret", () => {
    expect(verifyRazorpaySignature(orderId, paymentId, sign(orderId, paymentId), "")).toBe(false);
  });
});