export interface GatewayReadiness {
    configured: boolean;
    missing: string[];
}

export interface GatewayConfig {
    razorpay: GatewayReadiness;
    stripe: GatewayReadiness;
}

export const RAZORPAY_ENV = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID"];
export const STRIPE_ENV = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];

export function getGatewayReadiness(env: Record<string, string | undefined> = process.env): GatewayConfig {
    const readiness = (names: string[]): GatewayReadiness => {
        const missing = names.filter((n) => !env?.[n]);
        return { configured: missing.length === 0, missing };
    };
    return { razorpay: readiness(RAZORPAY_ENV), stripe: readiness(STRIPE_ENV) };
}