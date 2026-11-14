import { getDb } from "@/lib/server/firebase";
import { getHomepageContent } from "@/lib/cms";
import { verifyAdminRequest, tryAdminRequest } from "@/lib/server/adminAuth";
import { jsonSafe } from "@/lib/server/jsonSafe";
import { toPublicProduct } from "@/lib/server/productProjection";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

type ProductStatus = "live" | "upcoming" | "draft" | "archived";

interface ProductItem {
  id: string;
  [key: string]: unknown;
}

const PRODUCT_STATUSES: ProductStatus[] = ["live", "upcoming", "draft", "archived"];

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const categoryFilter = searchParams.get("category") || null;
  const sortBy = searchParams.get("sort") || "purchases";
  const limit = Number.parseInt(searchParams.get("limit") || "0", 10);

  // Valid admin tokens see drafts/archived and paid fields; everyone else gets
  // the public catalogue (live products, no download links).
  const admin = await tryAdminRequest(req);

  let products: ProductItem[] = [];
  try {
    const db = getDb();
    const snapshot = await db.collection("products").get();
    products = snapshot.docs.map((doc) => ({
      ...((jsonSafe(doc.data()) as Record<string, unknown>) ?? {}),
      id: doc.id,
    })) as ProductItem[];
  } catch (error) {
    console.error("Error reading products:", error instanceof Error ? error.message : error);
    products = [];
  }

  const normalised = products.map((p) => ({
    ...p,
    status: (p.status as ProductStatus | undefined) ?? "draft",
  })) as ProductItem[];

  let filtered = normalised;

  if (admin) {
    if (statusParam && PRODUCT_STATUSES.includes(statusParam as ProductStatus)) {
      filtered = filtered.filter((p) => p.status === statusParam);
    }
  } else {
    // Public callers always get live products only — never drafts.
    filtered = filtered.filter((p) => p.status === "live");
  }

  if (categoryFilter) {
    filtered = filtered.filter((p) => String(p.category) === categoryFilter);
  }

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

  if (limit > 0) {
    filtered = filtered.slice(0, limit);
  }

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

  const summary = {
    live: normalised.filter((p) => p.status === "live").length,
    upcoming: normalised.filter((p) => p.status === "upcoming").length,
    draft: normalised.filter((p) => p.status === "draft").length,
    archived: normalised.filter((p) => p.status === "archived").length,
    total: normalised.length,
  };

  const output = admin ? filtered : filtered.map(toPublicProduct);
  const cacheControl = admin
    ? "private, no-store, max-age=0"
    : "public, s-maxage=60, stale-while-revalidate=120";

  const origin = req.headers.get("origin") || null;
  return corsResponse(
    { products: output, categories, summary },
    { headers: { "Cache-Control": cacheControl } },
    origin
  );
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "products:create", limit: 30, windowMs: 60_000 });
  if (!limited.ok) {
    return corsResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      origin
    );
  }

  try {
    const authResult = await verifyAdminRequest(req);
    if (authResult.error) {
      return corsResponse(
        { error: authResult.error.message },
        { status: authResult.error.status },
        origin
      );
    }

    const body = await req.json();
    // Accept both schema conventions:
    // Nexus: name, price, imageUrl, demoUrl, description, features
    // Companion app: title, pricing, websiteUrl, shortDescription, techStack
    const {
      name,
      title,
      description,
      shortDescription,
      price,
      pricing,
      category,
      imageUrl,
      websiteUrl,
      demoUrl,
      version,
      downloadUrl,
      documentationUrl,
      longDescription,
      descriptionType,
      features,
      techStack,
      repoUrl,
      status,
      images,
      github,
    } = body ?? {};

    const finalName = (name || title || "").trim();
    const finalDescription = description || shortDescription || "";
    const finalPrice = typeof price === "number" ? price : typeof pricing === "number" ? pricing : undefined;
    const finalCategory = category || "";
    const finalImages = Array.isArray(images)
      ? images.filter((img): img is string => typeof img === "string" && img.trim() !== "")
      : [];
    const finalFeatures = Array.isArray(features) ? features : Array.isArray(techStack) ? techStack : [];
    const finalDemoUrl = demoUrl || websiteUrl || undefined;
    const finalVersion = version || undefined;
    const finalDownloadUrl = downloadUrl || undefined;
    const finalDocumentationUrl = documentationUrl || undefined;
    const finalLongDescription = longDescription || "";
    const finalDescriptionType =
      descriptionType === "plain" || descriptionType === "markdown" || descriptionType === "html"
        ? descriptionType
        : "plain";
    const finalRepoUrl = repoUrl || undefined;
    const finalStatus =
      typeof status === "string" && PRODUCT_STATUSES.includes(status as ProductStatus)
        ? (status as ProductStatus)
        : "draft";

    if (!finalName) {
      return corsResponse({ error: "Product name (or title) is required" }, { status: 400 }, origin);
    }
    if (typeof finalPrice !== "number" || !Number.isFinite(finalPrice) || finalPrice < 0) {
      return corsResponse({ error: "Valid price (or pricing) is required" }, { status: 400 }, origin);
    }
    if (!finalCategory || typeof finalCategory !== "string") {
      return corsResponse({ error: "Category is required" }, { status: 400 }, origin);
    }

    // Validate the cover image; fall back to the first gallery image.
    let validatedImageUrl = "";
    if (typeof imageUrl === "string" && imageUrl.trim() !== "") {
      try {
        validatedImageUrl = new URL(imageUrl).toString();
      } catch {
        console.warn("[products API] Ignoring invalid imageUrl");
      }
    }
    const finalImageUrl = validatedImageUrl || finalImages[0] || "";
    if (github !== undefined && github !== null && (typeof github !== "object" || Array.isArray(github))) {
      return corsResponse({ error: "github must be an object" }, { status: 400 }, origin);
    }
    const finalGithub =
      github && typeof github === "object" && !Array.isArray(github) ? github : undefined;

    const db = getDb();
    const newProduct: Record<string, unknown> = {
      name: finalName,
      description: finalDescription,
      price: finalPrice,
      category: finalCategory.trim(),
      imageUrl: finalImageUrl,
      images: finalImages,
      features: finalFeatures,
      demoUrl: finalDemoUrl,
      version: finalVersion,
      downloadUrl: finalDownloadUrl,
      documentationUrl: finalDocumentationUrl,
      longDescription: finalLongDescription,
      descriptionType: finalDescriptionType,
      repoUrl: finalRepoUrl,
      github: finalGithub,
      status: finalStatus,
      purchases: 0,
      createdAt: new Date().toISOString(),
    };

    const clean = Object.fromEntries(
      Object.entries(newProduct).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    const docRef = await db.collection("products").add(clean);

    return corsResponse({ id: docRef.id, ...clean }, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating product:", message);
    return corsResponse(
      { error: "Failed to create product", ...(process.env.NODE_ENV === "development" ? { details: message } : {}) },
      { status: 500 },
      origin
    );
  }
}
