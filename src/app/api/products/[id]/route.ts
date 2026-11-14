import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/firebase";
import { verifyIdToken, type FirebaseUserClaims } from "@/lib/server/verifyIdToken";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

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

/** Verify admin auth from Authorization header. Returns { claims, error }. */
async function assertAdminAuth(req: Request): Promise<{ claims?: FirebaseUserClaims; error?: { status: number; message: string } }> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { error: { status: 401, message: "Unauthorized" } };
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
    return { error: { status: 403, message: "Forbidden" } };
  }
  return { claims };
}

export const revalidate = 60;

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const db = getDb();
    const docSnap = await db.collection("products").doc(id).get();
    if (!docSnap.exists) {
      const origin = _req.headers.get("origin") || null;
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }
    const data = jsonSafe(docSnap.data()) as Record<string, unknown>;
    const origin = _req.headers.get("origin") || null;
    return corsResponse(
      {
        id: docSnap.id,
        status: (data.status as ProductStatus | undefined) ?? "draft",
        ...data,
      } as Record<string, unknown>,
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
      origin
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    const origin = _req.headers.get("origin") || null;
    return corsResponse({ error: "Failed to fetch product" }, { status: 500 }, origin);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const authResult = await assertAdminAuth(req);
    if (authResult.error) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: authResult.error.message }, { status: authResult.error.status }, origin);
    }

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

    // Validate
    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Product name is required" }, { status: 400 }, origin);
    }
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Valid price is required" }, { status: 400 }, origin);
    }
    if (category !== undefined && (!category || typeof category !== "string" || !category.trim())) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Category is required" }, { status: 400 }, origin);
    }

    const validStatuses: ProductStatus[] = ["live", "upcoming", "draft", "archived"];
    const productStatus = status && validStatuses.includes(status as ProductStatus) ? status : undefined;

    const db = getDb();
    const docRef = db.collection("products").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (features !== undefined) updateData.features = Array.isArray(features) ? features : [];
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl;
    if (version !== undefined) updateData.version = version;
    if (downloadUrl !== undefined) updateData.downloadUrl = downloadUrl;
    if (documentationUrl !== undefined) updateData.documentationUrl = documentationUrl;
    if (longDescription !== undefined) updateData.longDescription = longDescription;
    if (descriptionType !== undefined) {
      updateData.descriptionType =
        descriptionType === "plain" || descriptionType === "markdown" || descriptionType === "html"
          ? descriptionType
          : "plain";
    }
    if (repoUrl !== undefined) updateData.repoUrl = repoUrl;
    if (productStatus !== undefined) updateData.status = productStatus;

    const clean = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    await docRef.update(clean);

    const updatedSnap = await docRef.get();
    const origin = req.headers.get("origin") || null;
    return corsResponse(
      {
        id: updatedSnap.id,
        ...((jsonSafe(updatedSnap.data()) as Record<string, unknown>) ?? {}),
      } as Record<string, unknown>,
      {},
      origin
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating product:", message);
    const origin = req.headers.get("origin") || null;
    return corsResponse({ error: "Failed to update product" }, { status: 500 }, origin);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const authResult = await assertAdminAuth(req);
    if (authResult.error) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: authResult.error.message }, { status: authResult.error.status }, origin);
    }

    const db = getDb();
    const docRef = db.collection("products").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    await docRef.delete();

    const origin = req.headers.get("origin") || null;
    return corsResponse({ error: null, id, message: "Product deleted" }, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting product:", message);
    const origin = req.headers.get("origin") || null;
    return corsResponse({ error: "Failed to delete product" }, { status: 500 }, origin);
  }
}
