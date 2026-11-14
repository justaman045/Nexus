import { auth } from "./firebase";

export interface Order {
    id?: string;
    orderId?: string;
    productId: string;
    productName: string;
    amount: number;
    currency: string;
    status: "pending" | "paid" | "failed";
    paymentId?: string;
    gateway?: string;
    customerInfo?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    createdAt: string;
}

let cachedOrders: Order[] | null = null;
let lastOrdersFetch = 0;
let cachedFor: string | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/** Clear the admin orders cache (e.g. on sign-out or after a status change). */
export function clearOrdersCache(): void {
    cachedOrders = null;
    lastOrdersFetch = 0;
    cachedFor = null;
}

export async function getOrders(): Promise<Order[]> {
    const user = auth.currentUser;
    const cacheKey = user?.uid ?? null;

    // Never serve one account's cached orders to another (or to signed-out
    // visitors) — the cache is scoped to the current user.
    if (cachedOrders && cachedFor === cacheKey && Date.now() - lastOrdersFetch < CACHE_TTL) {
        return cachedOrders;
    }

    try {
        const idToken = user ? await user.getIdToken() : undefined;
        const headers: Record<string, string> = {};
        if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

        const res = await fetch("/api/orders", { headers, cache: "no-store" });
        if (!res.ok) throw new Error(`Orders API returned ${res.status}`);
        const data = await res.json();
        const orders = (data.orders || []) as Order[];

        cachedOrders = orders;
        cachedFor = cacheKey;
        lastOrdersFetch = Date.now();
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}
