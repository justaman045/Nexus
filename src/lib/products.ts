import { auth } from "./firebase";
import type { GitHubSnapshot } from "./github";

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    features: string[];
    category: string;
    demoUrl?: string;
    version?: string;
    downloadUrl?: string;
    documentationUrl?: string;
    longDescription?: string;
    descriptionType?: "plain" | "markdown" | "html";
    repoUrl?: string; // Synced GitHub repo URL
    github?: GitHubSnapshot; // Latest synced repo metadata
    purchases: number;
    createdAt: string;
    status?: "live" | "upcoming" | "draft" | "archived";
    images?: string[];
}

// Empty by design: the catalogue is Firestore-driven. Kept as the documented
// fallback for `getProducts()` when the API is unreachable.
export const MOCK_PRODUCTS: Product[] = [];

let cachedProducts: Product[] | null = null;
let lastProductsFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Clear the client-side product cache after an admin write. */
export function clearProductsCache(): void {
    cachedProducts = null;
    lastProductsFetch = 0;
}

function sortProducts(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
        const purchasesA = a.purchases || 0;
        const purchasesB = b.purchases || 0;
        if (purchasesB !== purchasesA) return purchasesB - purchasesA;

        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
    });
}

export async function getProducts(): Promise<Product[]> {
    if (cachedProducts && Date.now() - lastProductsFetch < CACHE_TTL) {
        return cachedProducts;
    }

    try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error(`Products API returned ${res.status}`);
        const data = await res.json();
        const products = sortProducts((data.products || []) as Product[]);
        cachedProducts = products;
        lastProductsFetch = Date.now();
        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        return MOCK_PRODUCTS;
    }
}

/**
 * Admin catalogue: includes drafts/archived products and paid fields
 * (`downloadUrl`, `repoUrl`). Bypasses the public cache.
 */
export async function getAdminProducts(): Promise<Product[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated. Please sign in.");
    const idToken = await user.getIdToken();

    const res = await fetch("/api/products?status=all&sort=createdAt", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Products API returned ${res.status}`);
    const data = await res.json();
    return sortProducts((data.products || []) as Product[]);
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Product API returned ${res.status}`);
        }
        const product = (await res.json()) as Product;
        // Refresh the shared cache so a subsequent getProducts() isn't stale
        if (cachedProducts) {
            const idx = cachedProducts.findIndex((p) => p.id === id);
            if (idx !== -1) cachedProducts[idx] = product;
            else cachedProducts.push(product);
            lastProductsFetch = Date.now();
        }
        return product;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
}

/** Seeds the sample catalogue + homepage content via the admin API. */
export async function seedProducts(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated. Please sign in.");
    const idToken = await user.getIdToken();

    const res = await fetch("/api/seed", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
    });
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error.error || "Failed to seed data");
    }

    clearProductsCache();
}
