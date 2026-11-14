import { NextResponse } from "next/server";
import { getHomepageContent } from "@/lib/cms";

export const revalidate = 60;

export async function GET() {
  try {
    const content = await getHomepageContent();
    return NextResponse.json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching CMS content:", message);
    return NextResponse.json({ error: "Failed to fetch CMS content" }, { status: 500 });
  }
}
