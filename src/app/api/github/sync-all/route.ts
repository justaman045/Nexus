import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { parseRepoInput, mergeSyncedWithManual } from "@/lib/github";
import { GitHubFetchError, fetchGitHubRepoServer } from "@/lib/server/githubFetch";
import { getDb } from "@/lib/server/firebase";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || null;
  return corsOptionsResponse(origin);
}

async function syncAll() {
  const db = getDb();
  const snap = await db.collection("products").get();
  const results: { synced: string[]; failed: { repo: string; error: string }[] } = {
    synced: [],
    failed: [],
  };

  const jobs: Promise<void>[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.repoUrl) continue;
    const parsed = parseRepoInput(data.repoUrl);
    if (!parsed) continue;

    jobs.push(
      (async () => {
        try {
          const fresh = await fetchGitHubRepoServer(parsed.owner, parsed.repo);
          const merged = mergeSyncedWithManual({ ...data, id: doc.id }, fresh);
          await db.collection("products").doc(doc.id).update(merged);
          results.synced.push(doc.id);
        } catch (err) {
          results.failed.push({
            repo: data.repoUrl,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })()
    );
  }

  await Promise.all(jobs);
  return results;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || null;

  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) {
    return corsResponse({ error: "CRON_SECRET not configured" }, { status: 503 }, origin);
  }

  const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization") || "";
  const provided = cronSecret.startsWith("Bearer ") ? cronSecret.slice(7) : cronSecret;
  if (provided !== CRON_SECRET) {
    return corsResponse({ error: "Forbidden" }, { status: 403 }, origin);
  }

  try {
    const results = await syncAll();
    return corsResponse(results, {}, origin);
  } catch (error) {
    console.error("GitHub sync-all error:", error);
    return corsResponse({ error: "Sync failed" }, { status: 500 }, origin);
  }
}
