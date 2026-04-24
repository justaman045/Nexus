
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

export interface Order {
    id?: string;
    productId: string;
    productName: string;
    amount: number;
    currency: string;
    status: "pending" | "paid" | "failed";
    paymentId?: string;
    customerInfo: {
        name?: string;
        email?: string;
        contact?: string;
    };
    createdAt: Timestamp;
}

export async function addOrder(order: Omit<Order, "id">) {
    try {
        const docRef = await addDoc(collection(db, "orders"), order);
        cachedOrders = null;
        return docRef.id;
    } catch (error) {
        console.error("Error adding order:", error);
        throw error;
    }
}

let cachedOrders: Order[] | null = null;
let lastOrdersFetch = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getOrders(): Promise<Order[]> {
    if (cachedOrders && Date.now() - lastOrdersFetch < CACHE_TTL) {
        return cachedOrders;
    }

    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Order));
        cachedOrders = orders;
        lastOrdersFetch = Date.now();
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}
