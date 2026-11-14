import { getDb } from "@/lib/server/firebase";
import { verifyUserRequest } from "@/lib/server/adminAuth";
import { jsonSafe } from "@/lib/server/jsonSafe";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

/**
 * Returns the licences belonging to the authenticated user's verified email,
 * together with the product details needed to download/use them.
 *
 * Firestore rules deny client reads of `licenses`, so this is the only
 * customer-facing path.
 */
export async function GET(req: Request) {
  const origin = req.headers.get("origin") || null;

  try {
    const authResult = await verifyUserRequest(req);
    if (authResult.error) {
      return corsResponse(
        { error: authResult.error.message },
        { status: authResult.error.status },
        origin
      );
    }

    const email = (authResult.claims?.email || "").toLowerCase();
    if (!email) {
      return corsResponse({ error: "Forbidden" }, { status: 403 }, origin);
    }

    const db = getDb();
    const snapshot = await db.collection("licenses").where("customerEmail", "==", email).get();

    const licenses: Array<Record<string, unknown> & { id: string; product: Record<string, unknown> | null }> =
      await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = (jsonSafe(doc.data()) as Record<string, unknown>) ?? {};
        const productId = typeof data.productId === "string" ? data.productId : "";
        let product: Record<string, unknown> | null = null;

        if (productId) {
          const productSnap = await db.collection("products").doc(productId).get();
          if (productSnap.exists) {
            const p = (jsonSafe(productSnap.data()) as Record<string, unknown>) ?? {};
            // Entitled customers may see the purchased download link.
            product = {
              id: productId,
              name: p.name ?? data.productName ?? "",
              description: p.description ?? "",
              imageUrl: p.imageUrl ?? "",
              images: p.images ?? [],
              category: p.category ?? "",
              version: p.version ?? "",
              price: p.price ?? 0,
              downloadUrl: p.downloadUrl ?? "",
              documentationUrl: p.documentationUrl ?? "",
              demoUrl: p.demoUrl ?? "",
            };
          }
        }

        return { id: doc.id, ...data, product };
      })
    );

    licenses.sort((a, b) => {
      const aTime = new Date(String(a.createdAt ?? 0)).getTime();
      const bTime = new Date(String(b.createdAt ?? 0)).getTime();
      return bTime - aTime;
    });

    return corsResponse({ licenses }, { headers: { "Cache-Control": "private, no-store" } }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching licenses:", message);
    return corsResponse({ error: "Failed to fetch licenses" }, { status: 500 }, origin);
  }
}
