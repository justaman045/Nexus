import { NextResponse } from "next/server";

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "content-type, authorization";

export function corsHeaders(origin: string | null = null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
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
