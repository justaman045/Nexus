import { getGatewayReadiness } from "@/lib/server/gatewayConfig";
import { verifyAdminRequest } from "@/lib/server/adminAuth";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin") || null;

  const authResult = await verifyAdminRequest(req);
  if (authResult.error) {
    return corsResponse(
      { error: authResult.error.message },
      { status: authResult.error.status },
      origin
    );
  }

  return corsResponse(getGatewayReadiness(), {}, origin);
}
