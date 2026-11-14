import { getDb } from "@/lib/server/firebase";
import { verifyAdminRequest } from "@/lib/server/adminAuth";
import { jsonSafe } from "@/lib/server/jsonSafe";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: Request) {
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

    const db = getDb();
    const querySnapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
    const orders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...((jsonSafe(doc.data()) as Record<string, unknown>) ?? {}),
    })) as Record<string, unknown>[];

    return corsResponse({ orders }, { headers: { "Cache-Control": "private, no-store" } }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching orders:", message);
    return corsResponse({ error: "Failed to fetch orders" }, { status: 500 }, origin);
  }
}
