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
    } = body ?? {};

    // Normalize fields: accept either naming convention
    const finalName = name !== undefined ? name.trim() : title !== undefined ? title.trim() : undefined;
    const finalDescription = description !== undefined ? description : shortDescription !== undefined ? shortDescription : undefined;
    const finalPrice = price !== undefined ? price : pricing !== undefined ? pricing : undefined;
    const finalCategory = category !== undefined ? category : undefined;
    const finalImageUrl = imageUrl !== undefined ? imageUrl : undefined;
    const finalImages = images !== undefined ? images : undefined;
    const finalFeatures = features !== undefined ? features : techStack !== undefined ? techStack : undefined;
    const finalDemoUrl = demoUrl !== undefined ? demoUrl : websiteUrl !== undefined ? websiteUrl : undefined;
    const finalVersion = version !== undefined ? version : undefined;
    const finalDownloadUrl = downloadUrl !== undefined ? downloadUrl : undefined;
    const finalDocumentationUrl = documentationUrl !== undefined ? documentationUrl : undefined;
    const finalLongDescription = longDescription !== undefined ? longDescription : undefined;
    const finalDescriptionType =
      descriptionType !== undefined &&
      (descriptionType === "plain" || descriptionType === "markdown" || descriptionType === "html")
        ? descriptionType
        : undefined;
    const finalRepoUrl = repoUrl !== undefined ? repoUrl : undefined;
    const finalStatus =
      status !== undefined && ["live", "upcoming", "draft", "archived"].includes(status) ? status : undefined;

    // Validate
    if (finalName !== undefined && (!finalName || typeof finalName !== "string" || !finalName.trim())) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Product name (or title) is required" }, { status: 400 }, origin);
    }
    if (finalPrice !== undefined && (typeof finalPrice !== "number" || finalPrice < 0)) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Valid price (or pricing) is required" }, { status: 400 }, origin);
    }
    if (finalCategory !== undefined && (!finalCategory || typeof finalCategory !== "string" || !finalCategory.trim())) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Category is required" }, { status: 400 }, origin);
    }

    const db = getDb();
    const docRef = db.collection("products").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      const origin = req.headers.get("origin") || null;
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    const updateData: Record<string, unknown> = {};
    if (finalName !== undefined) updateData.name = finalName.trim();
    if (finalDescription !== undefined) updateData.description = finalDescription;
    if (finalPrice !== undefined) updateData.price = finalPrice;
    if (finalCategory !== undefined) updateData.category = finalCategory.trim();
    if (finalImageUrl !== undefined) {
      if (typeof finalImageUrl === "string" && finalImageUrl.trim() !== "") {
        try {
          new URL(finalImageUrl);
          updateData.imageUrl = finalImageUrl;
        } catch {
          console.warn(`[products API] Invalid imageUrl: "${finalImageUrl}"`);
        }
      } else {
        updateData.imageUrl = "";
      }
    }
    if (finalImages !== undefined) updateData.images = finalImages;
    if (finalFeatures !== undefined) updateData.features = finalFeatures;
    if (finalDemoUrl !== undefined) updateData.demoUrl = finalDemoUrl;
    if (finalVersion !== undefined) updateData.version = finalVersion;
    if (finalDownloadUrl !== undefined) updateData.downloadUrl = finalDownloadUrl;
    if (finalDocumentationUrl !== undefined) updateData.documentationUrl = finalDocumentationUrl;
    if (finalLongDescription !== undefined) updateData.longDescription = finalLongDescription;
    if (finalDescriptionType !== undefined) updateData.descriptionType = finalDescriptionType;
    if (finalRepoUrl !== undefined) updateData.repoUrl = finalRepoUrl;
    if (finalStatus !== undefined) updateData.status = finalStatus;

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
