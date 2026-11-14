import { getDb } from "@/lib/server/firebase";
import { jsonSafe } from "@/lib/server/jsonSafe";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

/**
 * Customer order history lookup, scoped to an email address.
 *
 * Firestore rules deny client reads of `orders`, so this route is the only
 * supported path. It is intentionally email-scoped and rate limited; it never
 * returns anything but the orders belonging to the requested address.
 */
export async function GET(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "orders:lookup", limit: 15, windowMs: 60_000 });
  if (!limited.ok) {
    return corsResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      origin
    );
  }

  const email = (new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return corsResponse({ error: "A valid email is required" }, { status: 400 }, origin);
  }

  try {
    const db = getDb();
    const snapshot = await db.collection("orders").where("customerInfo.email", "==", email).get();

    const orders: Array<Record<string, unknown> & { id: string }> = snapshot.docs
      .map<Record<string, unknown> & { id: string }>((doc) => ({
        id: doc.id,
        ...((jsonSafe(doc.data()) as Record<string, unknown>) ?? {}),
      }))
      .sort((a, b) => {
        const aTime = new Date(String(a.createdAt ?? 0)).getTime();
        const bTime = new Date(String(b.createdAt ?? 0)).getTime();
        return bTime - aTime;
      });

    return corsResponse({ orders }, { headers: { "Cache-Control": "private, no-store" } }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error looking up orders:", message);
    return corsResponse({ error: "Failed to fetch orders" }, { status: 500 }, origin);
  }
}
