import { NextResponse } from "next/server";
import { getAuth } from "@/lib/server/firebase";
import { getGatewayReadiness } from "@/lib/server/gatewayConfig";

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
        const decoded = await getAuth().verifyIdToken(token);
        const email = (decoded.email || "").toLowerCase();
        const allowlist = getAllowlist();
        if (!email || (allowlist.length > 0 && !allowlist.includes(email))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(getGatewayReadiness());
}