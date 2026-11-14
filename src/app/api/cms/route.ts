import { getDb } from "@/lib/server/firebase";
import { getHomepageContent } from "@/lib/cms";
import { verifyAdminRequest } from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const revalidate = 60;

const HOMEPAGE_DOC_ID = "homepage_content";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: Request) {
  try {
    const content = await getHomepageContent();
    const origin = req.headers.get("origin") || null;
    return corsResponse(content, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching CMS content:", message);
    const origin = req.headers.get("origin") || null;
    return corsResponse({ error: "Failed to fetch CMS content" }, { status: 500 }, origin);
  }
}

/** Admin-only homepage content update (Admin SDK bypasses Firestore rules). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "cms:save", limit: 30, windowMs: 60_000 });
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
      return corsResponse({ error: "Invalid content payload" }, { status: 400 }, origin);
    }

    const db = getDb();
    await db.collection("content").doc(HOMEPAGE_DOC_ID).set(body, { merge: true });

    return corsResponse({ saved: true }, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving CMS content:", message);
    return corsResponse({ error: "Failed to save CMS content" }, { status: 500 }, origin);
  }
}
