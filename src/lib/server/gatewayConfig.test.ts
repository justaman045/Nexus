import { describe, it, expect } from "vitest";
import { getGatewayReadiness, STRIPE_ENV, RAZORPAY_ENV } from "./gatewayConfig";

describe("getGatewayReadiness", () => {
    it("reports configured when all required env vars are present", () => {
        const env = {
            RAZORPAY_KEY_ID: "rzp_x",
            RAZORPAY_KEY_SECRET: "rzp_s",
            NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_pub",
            STRIPE_SECRET_KEY: "sk_test_x",
            STRIPE_WEBHOOK_SECRET: "whsec_x",
        };
        const cfg = getGatewayReadiness(env);
        expect(cfg.razorpay.configured).toBe(true);
        expect(cfg.razorpay.missing).toEqual([]);
        expect(cfg.stripe.configured).toBe(true);
        expect(cfg.stripe.missing).toEqual([]);
    });

    it("lists missing names and flags not configured when env is empty", () => {
        const cfg = getGatewayReadiness({});
        expect(cfg.razorpay.configured).toBe(false);
        expect(cfg.stripe.configured).toBe(false);
        expect(STRIPE_ENV.every((n) => cfg.stripe.missing.includes(n))).toBe(true);
        expect(RAZORPAY_ENV.every((n) => cfg.razorpay.missing.includes(n))).toBe(true);
    });

    it("reports partial configuration for mixed env", () => {
        const cfg = getGatewayReadiness({ STRIPE_SECRET_KEY: "sk_live_x" });
        expect(cfg.stripe.configured).toBe(false);
        expect(cfg.stripe.missing).toEqual(["STRIPE_WEBHOOK_SECRET"]);
        expect(cfg.razorpay.configured).toBe(false);
        expect(cfg.razorpay.missing).toContain("RAZORPAY_KEY_ID");
    });

    it("treats empty-string values as missing", () => {
        const cfg = getGatewayReadiness({ STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "x" });
        expect(cfg.stripe.configured).toBe(false);
        expect(cfg.stripe.missing).toEqual(["STRIPE_SECRET_KEY"]);
    });
});