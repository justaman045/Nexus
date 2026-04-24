import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore";

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
    order?: number;
    purchases: number; // New for sorting
    createdAt: string; // New for sorting
}

const MOCK_PRODUCTS: Product[] = [
    {
        id: "1",
        name: "DevFlow Pro",
        description: "The ultimate project management tool for software engineers. Integrate git, ci/cd, and tasks in one view.",
        longDescription: "DevFlow Pro is designed for high-performance engineering teams. It seamlessly integrates with GitHub, GitLab, and Bitbucket to bring your code and tasks into a single, unified workflow. Features include advanced Kanban boards, automated sprint tracking, and built-in CI/CD pipeline visualization.",
        price: 49,
        imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1000",
        features: ["Git Integration", "CI/CD Pipelines", "Kanban Boards", "Dark Mode"],
        category: "Developer Tool",
        demoUrl: "https://example.com/demo/devflow",
        purchases: 1250,
        createdAt: "2023-01-15T10:00:00Z"
    },
    {
        id: "2",
        name: "PixelPerfect",
        description: "AI-powered design assistant that generates code from your Figma designs in seconds.",
        longDescription: "Stop wasting time hand-coding UI components. PixelPerfect analyzes your Figma designs and instantly generates clean, semantic React and Tailwind CSS code. It supports responsive layouts, custom design systems, and even complex animations.",
        price: 29,
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000",
        features: ["Figma to React", "Tailwind Support", "Responsive Layouts"],
        category: "Design",
        demoUrl: "https://example.com/demo/pixelperfect",
        purchases: 850,
        createdAt: "2023-03-10T14:30:00Z"
    },
    {
        id: "3",
        name: "FocusState",
        description: "A distraction-free writing environment and note-taking app for deep work.",
        longDescription: "FocusState provides a zen-like writing experience for improved concentration. With a minimal interface, markdown support, and cloud sync across all devices, it helps you capture your best ideas without distractions. Includes focus modes, typewriter scrolling, and export to PDF/HTML.",
        price: 19,
        imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1000",
        features: ["Markdown Support", "Cloud Sync", "Zen Mode"],
        category: "Productivity",
        demoUrl: "https://example.com/demo/focusstate",
        purchases: 2000,
        createdAt: "2023-05-20T09:15:00Z"
    },
];

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
    if (cachedProducts && Date.now() - lastProductsFetch < CACHE_TTL) {
        const cached = cachedProducts.find(p => p.id === id);
        if (cached) return cached;
    }

    try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Product;
        }
        return MOCK_PRODUCTS.find((p) => p.id === id) || null;
    } catch (error) {
        console.error("Error fetching product:", error);
        return MOCK_PRODUCTS.find((p) => p.id === id) || null;
    }
}

export async function addProduct(product: Omit<Product, "id" | "purchases" | "createdAt">) {
    const newProduct = {
        ...product,
        purchases: 0,
        createdAt: new Date().toISOString()
    };
    cachedProducts = null;
    return await addDoc(collection(db, "products"), newProduct);
}

export async function updateProduct(id: string, product: Partial<Product>) {
    const docRef = doc(db, "products", id);
    cachedProducts = null;
    return await setDoc(docRef, product, { merge: true });
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
}
