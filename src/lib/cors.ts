import { NextResponse } from "next/server";

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "content-type, authorization";

// Origins allowed to call the API from a browser. Extend with ALLOWED_ORIGINS
// (comma-separated) for preview deploys / the companion app.
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://nexusprods.vercel.app",
  "https://www.nexusprods.vercel.app",
  // The SaaS Waitlist admin dashboard mirrors products here.
  "https://projektnotify.vercel.app",
  "https://www.projektnotify.vercel.app",
];

function allowedOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extra])];
}

export function isAllowedOrigin(origin: string | null): origin is string {
  return Boolean(origin && allowedOrigins().includes(origin));
}

/**
 * CORS headers for a request. `Vary: Origin` is always set so shared caches
 * never serve one origin's `Access-Control-Allow-Origin` to another.
 */
export function corsHeaders(origin: string | null = null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
  };

  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function corsResponse(body: unknown, init?: ResponseInit, origin: string | null = null) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...corsHeaders(origin),
    },
  });
}

export function corsOptionsResponse(origin: string | null = null) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
