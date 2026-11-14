import { NextResponse } from "next/server";
import { getHomepageContent } from "@/lib/cms";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const revalidate = 60;

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: Request) {
  try {
    const content = await getHomepageContent();
    const origin = req.headers.get("origin") || null;
    return corsResponse(content, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching CMS content:", message);
    const origin = req.headers.get("origin") || null;
    return corsResponse({ error: "Failed to fetch CMS content" }, { status: 500 }, origin);
  }
}
