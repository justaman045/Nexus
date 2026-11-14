import { getDb } from "@/lib/server/firebase";
import { verifyAdminRequest } from "@/lib/server/adminAuth";
import { getGatewayReadiness } from "@/lib/server/gatewayConfig";
import { rateLimit } from "@/lib/server/rateLimit";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

const PAYMENT_DOC_ID = "payment";
const GATEWAYS = ["razorpay", "stripe"] as const;
type Gateway = (typeof GATEWAYS)[number];

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

/** Admin-only payment settings update, with server-side gateway readiness gate. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin") || null;

  const limited = rateLimit(req, { name: "settings:payment", limit: 20, windowMs: 60_000 });
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

    const body = (await req.json().catch(() => ({}))) as {
      gateway?: unknown;
      multiCurrencyEnabled?: unknown;
    };

    const db = getDb();
    const ref = db.collection("settings").doc(PAYMENT_DOC_ID);
    const snap = await ref.get();
    const current = (snap.data() ?? {}) as { gateway?: Gateway; multiCurrencyEnabled?: boolean };

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (body.gateway !== undefined) {
      if (typeof body.gateway !== "string" || !GATEWAYS.includes(body.gateway as Gateway)) {
        return corsResponse({ error: "Unknown payment gateway" }, { status: 400 }, origin);
      }
      const gateway = body.gateway as Gateway;
      const currentGateway = current.gateway === "stripe" ? "stripe" : "razorpay";

      // Never allow a switch to a gateway whose credentials are missing.
      if (gateway !== currentGateway) {
        const readiness = getGatewayReadiness()[gateway];
        if (!readiness.configured) {
          return corsResponse(
            {
              error: `${gateway} is not fully configured`,
              code: "gateway_not_configured",
              missing: readiness.missing,
            },
            { status: 409 },
            origin
          );
        }
      }
      update.gateway = gateway;
    }

    if (body.multiCurrencyEnabled !== undefined) {
      if (typeof body.multiCurrencyEnabled !== "boolean") {
        return corsResponse({ error: "multiCurrencyEnabled must be a boolean" }, { status: 400 }, origin);
      }
      update.multiCurrencyEnabled = body.multiCurrencyEnabled;
    }

    await ref.set(update, { merge: true });

    return corsResponse({ saved: true, ...update }, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving payment settings:", message);
    return corsResponse({ error: "Failed to save payment settings" }, { status: 500 }, origin);
  }
}
