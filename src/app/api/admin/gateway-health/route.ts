import { NextResponse } from "next/server";
import { getGatewayReadiness } from "@/lib/server/gatewayConfig";
import { verifyIdToken } from "@/lib/server/verifyIdToken";

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

export async function GET(req: Request) {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const claims = await verifyIdToken(token, getProjectId());
        const email = (claims.email || "").toLowerCase();
        const allowlist = getAllowlist();
        if (!email || (allowlist.length > 0 && !allowlist.includes(email))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(getGatewayReadiness());
}