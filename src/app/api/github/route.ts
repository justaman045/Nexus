import { NextRequest, NextResponse } from "next/server";
import { GitHubFetchError, fetchGitHubRepoServer } from "@/lib/server/githubFetch";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") || null;
  const { searchParams } = req.nextUrl;
  const owner = searchParams.get("owner")?.trim() ?? "";
  const repo = searchParams.get("repo")?.trim() ?? "";
  const includeReadme = searchParams.get("readme") !== "0";
  const force = searchParams.get("force") === "1";

  try {
    const data = await fetchGitHubRepoServer(owner, repo, { includeReadme, force });
    return corsResponse(data, {}, origin);
  } catch (err) {
    if (err instanceof GitHubFetchError) {
      return corsResponse({ error: err.message }, { status: err.status }, origin);
    }
    console.error("GitHub fetch error:", err);
    return corsResponse({ error: "GitHub API error." }, { status: 502 }, origin);
  }
}
