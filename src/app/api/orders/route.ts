import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/firebase";
import { verifyIdToken, type FirebaseUserClaims } from "@/lib/server/verifyIdToken";

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
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authResult = await assertAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }

    const db = getDb();
    const querySnapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...((jsonSafe(doc.data()) as Record<string, unknown>) ?? {}),
    })) as Record<string, unknown>[];

    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching orders:", message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
