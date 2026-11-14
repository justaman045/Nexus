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
const CACHE_TTL = 5 * 60 * 1000;

export async function getOrders(): Promise<Order[]> {
    if (cachedOrders && Date.now() - lastOrdersFetch < CACHE_TTL) {
        return cachedOrders;
    }

    try {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : undefined;
        const headers: Record<string, string> = {};
        if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

        const res = await fetch("/api/orders", { headers });
        if (!res.ok) throw new Error(`Orders API returned ${res.status}`);
        const data = await res.json();
        const orders = (data.orders || []) as Order[];

        cachedOrders = orders;
        lastOrdersFetch = Date.now();
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}
