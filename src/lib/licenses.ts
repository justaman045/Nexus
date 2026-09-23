import { db } from "./firebase";
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";

export interface License {
    id?: string;
    licenseKey: string;
    productId: string;
    productName: string;
    customerEmail: string;
    orderId: string;
    createdAt: Timestamp;
    status: "active" | "revoked";
}

export async function getLicensesByEmail(email: string): Promise<License[]> {
    try {
        const q = query(
            collection(db, "licenses"),
            where("customerEmail", "==", email),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as License));
    } catch (error) {
        console.error("Error fetching licenses:", error);
        return [];
    }
}