import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
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
    version?: string; // New
    downloadUrl?: string; // New
    documentationUrl?: string; // New
    longDescription?: string;
    descriptionType?: "plain" | "markdown" | "html";
    repoUrl?: string; // Synced GitHub repo URL
    github?: GitHubSnapshot; // Latest synced repo metadata
    purchases: number; // New for sorting
    createdAt: string; // New for sorting
    status?: "live" | "upcoming" | "draft" | "archived"; // Product publication status
}

export const MOCK_PRODUCTS: Product[] = [];

let cachedProducts: Product[] | null = null;
let lastProductsFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getProducts(): Promise<Product[]> {
    if (cachedProducts && Date.now() - lastProductsFetch < CACHE_TTL) {
        return cachedProducts;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        if (querySnapshot.empty) {
            return MOCK_PRODUCTS;
        }
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        // Sort by purchases (desc), then by createdAt (newest first)
        const sortedProducts = products.sort((a, b) => {
            const purchasesA = a.purchases || 0;
            const purchasesB = b.purchases || 0;

            if (purchasesB !== purchasesA) {
                return purchasesB - purchasesA; // Higher purchases first
            }

            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA; // Newer date first
        });

        cachedProducts = sortedProducts;
        lastProductsFetch = Date.now();
        return sortedProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return MOCK_PRODUCTS;
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const product = { id: docSnap.id, ...docSnap.data() } as Product;
            // Refresh the shared cache so a subsequent getProducts() isn't stale
            if (cachedProducts) {
                const idx = cachedProducts.findIndex((p) => p.id === id);
                if (idx !== -1) cachedProducts[idx] = product;
                else cachedProducts.push(product);
                lastProductsFetch = Date.now();
            }
            return product;
        }
        return null;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
}

export async function addProduct(product: Omit<Product, "id" | "purchases" | "createdAt">) {
    const newProduct = {
        ...product,
        purchases: 0,
        createdAt: new Date().toISOString(),
        status: product.status ?? "draft",
    };
    // Firestore Web SDK rejects `undefined` field values synchronously.
    // Strip them before writing.
    const clean = Object.fromEntries(
        Object.entries(newProduct).filter(([, v]) => v !== undefined)
    );
    cachedProducts = null;
    return await addDoc(collection(db, "products"), clean);
}

export async function updateProduct(id: string, product: Partial<Product>) {
    const docRef = doc(db, "products", id);
    // Strip undefined fields — Firestore Web SDK rejects `undefined` values
    // synchronously in setDoc.
    const clean = Object.fromEntries(
        Object.entries(product).filter(([, v]) => v !== undefined)
    );
    cachedProducts = null;
    return await setDoc(docRef, clean, { merge: true });
}

export async function deleteProduct(id: string) {
    cachedProducts = null;
    return await deleteDoc(doc(db, "products", id));
}

// Function to seed initial data
export async function seedProducts() {
    for (const product of MOCK_PRODUCTS) {
        // Use setDoc with specific ID to avoid duplicates on re-seed if IDs match
        await setDoc(doc(db, "products", product.id), product);
    }
    cachedProducts = null;
    lastProductsFetch = 0;
}
