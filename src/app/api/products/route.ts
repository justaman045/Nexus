import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/firebase";
import { MOCK_PRODUCTS } from "@/lib/products";
import { getHomepageContent } from "@/lib/cms";
import { verifyIdToken } from "@/lib/server/verifyIdToken";

/** Convert Firestore Timestamp values to ISO strings so the response is JSON-safe. */
function jsonSafe(value: unknown): unknown {
  if (value && typeof value === "object") {
    if (Array.isArray(value)) return value.map(jsonSafe);
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === "function") return maybeTs.toDate().toISOString();
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = jsonSafe(v);
    return out;
  }
  return value;
}

type ProductStatus = "live" | "upcoming" | "draft" | "archived";

interface ProductItem {
  id: string;
  [key: string]: unknown;
}

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") as ProductStatus | null;
  const categoryFilter = searchParams.get("category") || null;
  const sortBy = searchParams.get("sort") || "purchases";
  const limit = parseInt(searchParams.get("limit") || "0", 10);

  let products: ProductItem[] = [];

  try {
    const db = getDb();
    const snapshot = await db.collection("products").get();
    if (snapshot.empty) {
      products = MOCK_PRODUCTS.map((p) => ({ ...p, id: p.id } as ProductItem));
    } else {
      products = snapshot.docs.map((doc) => ({
        ...((jsonSafe(doc.data()) as Record<string, unknown>) ?? {}),
        id: doc.id,
      })) as ProductItem[];
    }
  } catch {
    products = MOCK_PRODUCTS.map((p) => ({ ...p, id: p.id } as ProductItem));
  }

  // Normalise status: treat missing status as "draft"
  const normalised = products.map((p) => ({
    ...p,
    status: (p.status as ProductStatus | undefined) ?? "draft",
  })) as ProductItem[];

  // Apply filters
  let filtered = normalised;
  if (statusFilter) {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }
  if (categoryFilter) {
    filtered = filtered.filter((p) => String(p.category) === categoryFilter);
  }

  // Apply sort
  if (sortBy === "purchases") {
    filtered = [...filtered].sort((a, b) => Number(b.purchases || 0) - Number(a.purchases || 0));
  } else if (sortBy === "createdAt") {
    filtered = [...filtered].sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );
  } else if (sortBy === "price") {
    filtered = [...filtered].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sortBy === "name") {
    filtered = [...filtered].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }

  // Apply limit
  if (limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  // Build categories list from products + CMS
  const allCategories = new Set<string>();
  normalised.forEach((p) => {
    if (p.category) allCategories.add(String(p.category));
  });
  try {
    const content = await getHomepageContent();
    if (content?.categories) {
      content.categories.forEach((c: string) => allCategories.add(c));
    }
  } catch {
    // CMS unavailable — rely on product-derived categories only
  }
  const categories = Array.from(allCategories).sort();

  // Build summary counts across ALL products (not filtered)
  const summary = {
    live: normalised.filter((p) => p.status === "live").length,
    upcoming: normalised.filter((p) => p.status === "upcoming").length,
    draft: normalised.filter((p) => p.status === "draft").length,
    archived: normalised.filter((p) => p.status === "archived").length,
    total: normalised.length,
  };

  return NextResponse.json(
    { products: filtered, categories, summary },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}

export async function POST(req: Request) {
  try {
    // Admin auth: verify Firebase ID token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const getProjectId = (): string => {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
      const parsed = JSON.parse(raw) as { project_id?: string };
      if (!parsed.project_id) throw new Error("FIREBASE_SERVICE_ACCOUNT missing project_id");
      return parsed.project_id;
    };

    const projectId = getProjectId();
    const claims = await verifyIdToken(token, projectId);
    const email = (claims.email || "").toLowerCase();
    const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowlist.length === 0 || !claims.emailVerified || !allowlist.includes(email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate body
    const body = await req.json();
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      features,
      demoUrl,
      version,
      downloadUrl,
      documentationUrl,
      longDescription,
      descriptionType,
      repoUrl,
      status,
    } = body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    const validStatuses: ProductStatus[] = ["live", "upcoming", "draft", "archived"];
    const productStatus = status && validStatuses.includes(status as ProductStatus) ? status : "draft";

    const db = getDb();
    const newProduct: Record<string, unknown> = {
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      price,
      category: category.trim(),
      imageUrl: typeof imageUrl === "string" ? imageUrl : "",
      features: Array.isArray(features) ? features : [],
      demoUrl: typeof demoUrl === "string" ? demoUrl : undefined,
      version: typeof version === "string" ? version : undefined,
      downloadUrl: typeof downloadUrl === "string" ? downloadUrl : undefined,
      documentationUrl: typeof documentationUrl === "string" ? documentationUrl : undefined,
      longDescription: typeof longDescription === "string" ? longDescription : "",
      descriptionType:
        descriptionType === "plain" || descriptionType === "markdown" || descriptionType === "html"
          ? descriptionType
          : "plain",
      repoUrl: typeof repoUrl === "string" ? repoUrl : undefined,
      status: productStatus,
      purchases: 0,
      createdAt: new Date().toISOString(),
    };

    // Strip undefined values (Firestore Web SDK rejects them)
    const clean = Object.fromEntries(
      Object.entries(newProduct).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    const docRef = await db.collection("products").add(clean);

    return NextResponse.json({
      id: docRef.id,
      ...clean,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
