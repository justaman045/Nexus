import { NextRequest } from "next/server";
import { GitHubFetchError, fetchGitHubRepoServer } from "@/lib/server/githubFetch";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const owner = searchParams.get("owner")?.trim() ?? "";
  const repo = searchParams.get("repo")?.trim() ?? "";
  const includeReadme = searchParams.get("readme") !== "0";
  const force = searchParams.get("force") === "1";

  try {
    const data = await fetchGitHubRepoServer(owner, repo, { includeReadme, force });
    return Response.json(data);
  } catch (err) {
    if (err instanceof GitHubFetchError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("GitHub fetch error:", err);
    return Response.json({ error: "GitHub API error." }, { status: 502 });
  }
}