import { getDb } from "@/lib/server/firebase";
import { verifyAdminRequest, tryAdminRequest } from "@/lib/server/adminAuth";
import { jsonSafe } from "@/lib/server/jsonSafe";
import { toPublicProduct } from "@/lib/server/productProjection";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

type ProductStatus = "live" | "upcoming" | "draft" | "archived";

const PRODUCT_STATUSES: ProductStatus[] = ["live", "upcoming", "draft", "archived"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: Request, { params }: RouteContext) {
  const origin = req.headers.get("origin") || null;
  try {
    const { id } = await params;
    const admin = await tryAdminRequest(req);

    const db = getDb();
    const docSnap = await db.collection("products").doc(id).get();
    if (!docSnap.exists) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    const data = (jsonSafe(docSnap.data()) as Record<string, unknown>) ?? {};
    const status = (data.status as ProductStatus | undefined) ?? "draft";
    // Drafts/archived products are invisible to the public catalogue.
    if (!admin && status !== "live") {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    const product: Record<string, unknown> = { ...data, id, status };
    const output = admin ? product : toPublicProduct(product);

    return corsResponse(
      output,
      {
        headers: {
          "Cache-Control": admin
            ? "private, no-store, max-age=0"
            : "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
      origin
    );
  } catch (error) {
    console.error("Error fetching product:", error instanceof Error ? error.message : error);
    return corsResponse({ error: "Failed to fetch product" }, { status: 500 }, origin);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "products:update", limit: 60, windowMs: 60_000 });
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

    const { id } = await params;
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
      github,
    } = body ?? {};

    // Normalize fields: accept either naming convention
    const finalName = name !== undefined ? String(name).trim() : title !== undefined ? String(title).trim() : undefined;
    const finalDescription = description !== undefined ? description : shortDescription !== undefined ? shortDescription : undefined;
    const finalPrice = price !== undefined ? price : pricing !== undefined ? pricing : undefined;
    const finalCategory = category !== undefined ? category : undefined;
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
      typeof status === "string" && PRODUCT_STATUSES.includes(status as ProductStatus)
        ? (status as ProductStatus)
        : undefined;

    // Validate
    if (status !== undefined && finalStatus === undefined) {
      return corsResponse(
        { error: `status must be one of: ${PRODUCT_STATUSES.join(", ")}` },
        { status: 400 },
        origin
      );
    }
    if (github !== undefined && github !== null && (typeof github !== "object" || Array.isArray(github))) {
      return corsResponse({ error: "github must be an object" }, { status: 400 }, origin);
    }
    if (finalName !== undefined && (!finalName || typeof finalName !== "string")) {
      return corsResponse({ error: "Product name (or title) is required" }, { status: 400 }, origin);
    }
    if (finalPrice !== undefined && (typeof finalPrice !== "number" || !Number.isFinite(finalPrice) || finalPrice < 0)) {
      return corsResponse({ error: "Valid price (or pricing) is required" }, { status: 400 }, origin);
    }
    if (finalCategory !== undefined && (!finalCategory || typeof finalCategory !== "string" || !String(finalCategory).trim())) {
      return corsResponse({ error: "Category is required" }, { status: 400 }, origin);
    }

    const db = getDb();
    const docRef = db.collection("products").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    const updateData: Record<string, unknown> = {};
    if (finalName !== undefined) updateData.name = finalName.trim();
    if (finalDescription !== undefined) updateData.description = finalDescription;
    if (finalPrice !== undefined) updateData.price = finalPrice;
    if (finalCategory !== undefined) updateData.category = String(finalCategory).trim();
    if (imageUrl !== undefined) {
      if (typeof imageUrl === "string" && imageUrl.trim() !== "") {
        try {
          updateData.imageUrl = new URL(imageUrl).toString();
        } catch {
          return corsResponse({ error: "Invalid imageUrl" }, { status: 400 }, origin);
        }
      } else {
        updateData.imageUrl = "";
      }
    }
    if (finalImages !== undefined) {
      if (!Array.isArray(finalImages)) {
        return corsResponse({ error: "images must be an array of URLs" }, { status: 400 }, origin);
      }
      updateData.images = finalImages.filter(
        (img): img is string => typeof img === "string" && img.trim() !== ""
      );
    }
    if (finalFeatures !== undefined) updateData.features = finalFeatures;
    if (finalDemoUrl !== undefined) updateData.demoUrl = finalDemoUrl;
    if (finalVersion !== undefined) updateData.version = finalVersion;
    if (finalDownloadUrl !== undefined) updateData.downloadUrl = finalDownloadUrl;
    if (finalDocumentationUrl !== undefined) updateData.documentationUrl = finalDocumentationUrl;
    if (finalLongDescription !== undefined) updateData.longDescription = finalLongDescription;
    if (finalDescriptionType !== undefined) updateData.descriptionType = finalDescriptionType;
    if (finalRepoUrl !== undefined) updateData.repoUrl = finalRepoUrl;
    if (github !== undefined) updateData.github = github;
    if (finalStatus !== undefined) updateData.status = finalStatus;

    const clean = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    if (Object.keys(clean).length > 0) {
      await docRef.update(clean);
    }

    return corsResponse({ id, ...clean }, {}, origin);
  } catch (error) {
    console.error("Error updating product:", error instanceof Error ? error.message : error);
    return corsResponse({ error: "Failed to update product" }, { status: 500 }, origin);
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const origin = req.headers.get("origin") || null;
  try {
    const authResult = await verifyAdminRequest(req);
    if (authResult.error) {
      return corsResponse(
        { error: authResult.error.message },
        { status: authResult.error.status },
        origin
      );
    }

    const { id } = await params;
    const db = getDb();
    const docRef = db.collection("products").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return corsResponse({ error: "Product not found" }, { status: 404 }, origin);
    }

    await docRef.delete();
    return corsResponse({ deleted: true, id }, {}, origin);
  } catch (error) {
    console.error("Error deleting product:", error instanceof Error ? error.message : error);
    return corsResponse({ error: "Failed to delete product" }, { status: 500 }, origin);
  }
}
