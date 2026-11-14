import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/firebase";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

const LIMITS = { name: 200, email: 200, subject: 200, message: 5000 };

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

/**
 * Contact form submission. Written with the Admin SDK so logged-out visitors
 * can contact the store; input is validated and rate limited here instead of
 * being subject to the Firestore `contacts` rules.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "contact", limit: 5, windowMs: 60_000 });
  if (!limited.ok) {
    return corsResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      origin
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return corsResponse({ error: "All fields are required" }, { status: 400 }, origin);
    }
    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      subject.length > LIMITS.subject ||
      message.length > LIMITS.message
    ) {
      return corsResponse({ error: "One or more fields are too long" }, { status: 400 }, origin);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return corsResponse({ error: "A valid email is required" }, { status: 400 }, origin);
    }

    const db = getDb();
    await db.collection("contacts").add({
      name,
      email,
      subject,
      message,
      createdAt: FieldValue.serverTimestamp(),
    });

    return corsResponse({ received: true }, { status: 201 }, origin);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("Error submitting contact form:", detail);
    return corsResponse({ error: "Failed to send message" }, { status: 500 }, origin);
  }
}
