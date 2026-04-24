import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";

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

export async function generateLicense(data: Omit<License, "id" | "createdAt" | "status" | "licenseKey">) {
    // Simple license key generation: XXXX-XXXX-XXXX-XXXX
    const segments = [];
    for (let i = 0; i < 4; i++) {
        segments.push(Math.random().toString(36).substring(2, 6).toUpperCase());
    }
    const licenseKey = segments.join("-");

    const newLicense: Omit<License, "id"> = {
        ...data,
        licenseKey,
        status: "active",
        createdAt: Timestamp.now(),
    };

    try {
        const docRef = await addDoc(collection(db, "licenses"), newLicense);
        return { id: docRef.id, licenseKey };
    } catch (error) {
        console.error("Error generating license:", error);
        throw error;
    }
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
