import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { parseRepoInput, mergeSyncedWithManual } from "@/lib/github";
import { GitHubFetchError, fetchGitHubRepoServer } from "@/lib/server/githubFetch";
import { getDb } from "@/lib/server/firebase";

export const dynamic = "force-dynamic";

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
    const repoId = typeof data.repoUrl === "string" ? data.repoUrl : undefined;
    if (!repoId) continue;
    const parsed = parseRepoInput(repoId);
    if (!parsed) continue;

    const productId = doc.id;
    const job = (async () => {
      const label = `${parsed.owner}/${parsed.repo}`;
      try {
        const fresh = await fetchGitHubRepoServer(parsed.owner, parsed.repo, { includeReadme: true, force: true });
        const merged = mergeSyncedWithManual({ ...data, id: productId }, fresh);

        const payload: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(merged) as [string, unknown][]) {
          if (key === "id" || key === "purchases" || key === "createdAt") continue;
          if (value === undefined) {
            // Clear fields the sync no longer produces (e.g. version without a release).
            payload[key] = FieldValue.delete();
          } else {
            payload[key] = value;
          }
        }
        await db.collection("products").doc(productId).update(payload);
        results.synced.push(label);
      } catch (err) {
        results.failed.push({
          repo: label,
          error: err instanceof GitHubFetchError ? err.message : "Unknown error",
        });
      }
    })();
    jobs.push(job);
  }

  await Promise.allSettled(jobs);
  return { scanned: snap.size, syncedCount: results.synced.length, synced: results.synced, failed: results.failed };
}

async function run(req: NextRequest) {
  // Optional guard set via CRON_SECRET; Vercel Cron sends it as a Bearer token.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncAll();
    return NextResponse.json(result);
  } catch (err) {
    console.error("GitHub sync-all failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export function GET(req: NextRequest) {
  return run(req);
}

export function POST(req: NextRequest) {
  return run(req);
}