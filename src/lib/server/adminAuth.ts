import { verifyIdToken, type FirebaseUserClaims } from "./verifyIdToken";

export interface AuthFailure {
  status: number;
  message: string;
}

export interface AuthResult {
  claims?: FirebaseUserClaims;
  error?: AuthFailure;
}

/** The Firebase project id is read from the Admin service account JSON. */
export function getProjectId(): string {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  const parsed = JSON.parse(raw) as { project_id?: string };
  if (!parsed.project_id) throw new Error("FIREBASE_SERVICE_ACCOUNT missing project_id");
  return parsed.project_id;
}

/** Admin allowlist from NEXT_PUBLIC_ADMIN_EMAILS (lower-cased). */
export function getAdminAllowlist(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function bearerToken(req: Request): string {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

/**
 * Verify an admin request. Fails closed: a missing allowlist is a server
 * misconfiguration (503), never "everyone is admin".
 */
export async function verifyAdminRequest(req: Request): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) return { error: { status: 401, message: "Unauthorized" } };

  let claims: FirebaseUserClaims;
  try {
    claims = await verifyIdToken(token, getProjectId());
  } catch {
    return { error: { status: 401, message: "Invalid or expired token" } };
  }

  const allowlist = getAdminAllowlist();
  if (allowlist.length === 0) {
    return { error: { status: 503, message: "Admin allowlist not configured" } };
  }

  const email = (claims.email || "").toLowerCase();
  if (!claims.emailVerified || !email || !allowlist.includes(email)) {
    return { error: { status: 403, message: "Forbidden" } };
  }

  return { claims };
}

/**
 * Verify any signed-in user with a verified email. Used by customer-scoped
 * routes (licences, order history).
 */
export async function verifyUserRequest(req: Request): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) return { error: { status: 401, message: "Unauthorized" } };

  try {
    const claims = await verifyIdToken(token, getProjectId());
    if (!claims.emailVerified || !claims.email) {
      return { error: { status: 403, message: "Email not verified" } };
    }
    return { claims };
  } catch {
    return { error: { status: 401, message: "Invalid or expired token" } };
  }
}

/**
 * Best-effort admin check for read endpoints: returns the claims when the
 * caller is an admin, otherwise null (the request is treated as public).
 */
export async function tryAdminRequest(req: Request): Promise<FirebaseUserClaims | null> {
  if (!bearerToken(req)) return null;
  try {
    const result = await verifyAdminRequest(req);
    return result.claims ?? null;
  } catch {
    return null;
  }
}
