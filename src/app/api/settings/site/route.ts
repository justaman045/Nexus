import { getDb } from "@/lib/server/firebase";
import { verifyAdminRequest } from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

const SETTINGS_DOC_ID = "site";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

/** Admin-only site settings update. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "settings:site", limit: 30, windowMs: 60_000 });
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return corsResponse({ error: "Invalid settings payload" }, { status: 400 }, origin);
    }

    const db = getDb();
    await db.collection("settings").doc(SETTINGS_DOC_ID).set(body, { merge: true });

    return corsResponse({ saved: true }, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving site settings:", message);
    return corsResponse({ error: "Failed to save site settings" }, { status: 500 }, origin);
  }
}
