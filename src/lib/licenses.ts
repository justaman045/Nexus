import { auth } from "./firebase";

export interface LicensedProduct {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    images: string[];
    category: string;
    version: string;
    price: number;
    downloadUrl: string;
    documentationUrl: string;
    demoUrl: string;
}

export interface License {
    id?: string;
    licenseKey: string;
    productId: string;
    productName: string;
    customerEmail: string;
    orderId: string;
    /** ISO string — the server converts Firestore Timestamps before responding. */
    createdAt: string;
    status: "active" | "revoked";
    /** Product details, joined server-side for entitled customers. */
    product?: LicensedProduct | null;
}

/**
 * Licences are not client-readable (Firestore rules), so this calls the
 * authenticated server route which scopes the query to the signed-in email.
 */
export async function getLicensesByEmail(_email?: string): Promise<License[]> {
    void _email; // retained for call-site clarity; the server scopes by token
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/licenses", {
            headers: { Authorization: `Bearer ${idToken}` },
            cache: "no-store",
        });
        if (!res.ok) throw new Error(`Licenses API returned ${res.status}`);
        const data = (await res.json()) as { licenses?: License[] };
        return data.licenses ?? [];
    } catch (error) {
        console.error("Error fetching licenses:", error);
        return [];
    }
}
