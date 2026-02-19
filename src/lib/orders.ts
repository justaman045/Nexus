
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
        return docRef.id;
    } catch (error) {
        console.error("Error adding order:", error);
        throw error;
    }
}

export async function getOrders(): Promise<Order[]> {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Order));
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}
