import { NextResponse } from "next/server";
import { getGatewayReadiness } from "@/lib/server/gatewayConfig";
import { verifyIdToken } from "@/lib/server/verifyIdToken";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

function getProjectId(): string {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
    try {
        const parsed = JSON.parse(raw) as { project_id?: string };
        if (!parsed.project_id) throw new Error("FIREBASE_SERVICE_ACCOUNT missing project_id");
        return parsed.project_id;
    } catch (e) {
        throw new Error(`FIREBASE_SERVICE_ACCOUNT invalid: ${e instanceof Error ? e.message : String(e)}`);
    }
}

const getAllowlist = (): string[] =>
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

export async function OPTIONS(req: Request) {
    const origin = req.headers.get("origin") || null;
    return corsOptionsResponse(origin);
}

export async function GET(req: Request) {
    const origin = req.headers.get("origin") || null;

    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
        return corsResponse({ error: "Unauthorized" }, { status: 401 }, origin);
    }

    try {
        const claims = await verifyIdToken(token, getProjectId());
        const email = (claims.email || "").toLowerCase();
        const allowlist = getAllowlist();
        if (allowlist.length === 0) {
            return corsResponse({ error: "Admin allowlist not configured" }, { status: 503 }, origin);
        }
        if (!email || !claims.emailVerified || !allowlist.includes(email)) {
            return corsResponse({ error: "Forbidden" }, { status: 403 }, origin);
        }

        return corsResponse(getGatewayReadiness(), {}, origin);
    } catch {
        return corsResponse({ error: "Forbidden" }, { status: 403 }, origin);
    }
}
