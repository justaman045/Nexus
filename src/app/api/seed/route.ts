import { getDb } from "@/lib/server/firebase";
import { verifyAdminRequest } from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

const HOMEPAGE_DOC_ID = "homepage_content";

interface SeedProduct {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  category: string;
  features: string[];
  status: "live";
}

// Small, clearly-labelled sample catalogue used by the "seed" action in the
// admin settings page. Deterministic ids make re-seeding idempotent.
const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "sample-devflow-pro",
    name: "DevFlow Pro",
    description: "A focused workflow tool for shipping software faster.",
    longDescription:
      "DevFlow Pro bundles issue tracking, release notes and CI insights into one fast, keyboard-first workspace.\n\nReplaced with your real product when you edit it in the admin console.",
    price: 49,
    category: "Developer Tool",
    features: ["Issue tracking", "Release automation", "Keyboard-first UI"],
    status: "live",
  },
  {
    id: "sample-pixelforge",
    name: "PixelForge",
    description: "Design assets and UI kits for product teams.",
    longDescription:
      "A growing library of production-ready components, icons and templates for modern product teams.\n\nReplaced with your real product when you edit it in the admin console.",
    price: 29,
    category: "Design",
    features: ["Figma library", "Icon set", "Dark mode variants"],
    status: "live",
  },
  {
    id: "sample-focustimer",
    name: "FocusTimer",
    description: "A minimal focus timer that respects your attention.",
    longDescription:
      "Pomodoro-style sessions, ambient soundscapes and weekly focus reports — with zero notifications while you work.\n\nReplaced with your real product when you edit it in the admin console.",
    price: 9,
    category: "Productivity",
    features: ["Pomodoro sessions", "Weekly reports", "Ambient sounds"],
    status: "live",
  },
];

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

/**
 * Admin-only seeding: writes the default homepage content (client supplies it)
 * and a small sample catalogue. Uses the Admin SDK so it works regardless of
 * which admin email is configured in Firestore rules.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "seed", limit: 5, windowMs: 60_000 });
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

    const body = (await req.json().catch(() => ({}))) as { content?: unknown };
    const db = getDb();

    if (body.content && typeof body.content === "object" && !Array.isArray(body.content)) {
      await db.collection("content").doc(HOMEPAGE_DOC_ID).set(body.content, { merge: true });
    }

    const products = db.collection("products");
    let seededProducts = 0;
    for (const product of SEED_PRODUCTS) {
      const ref = products.doc(product.id);
      const existing = await ref.get();
      if (existing.exists) continue;
      await ref.set({
        ...product,
        imageUrl: "",
        images: [],
        purchases: 0,
        createdAt: new Date().toISOString(),
      });
      seededProducts += 1;
    }

    return corsResponse({ seeded: true, seededProducts }, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error seeding data:", message);
    return corsResponse({ error: "Failed to seed data" }, { status: 500 }, origin);
  }
}
