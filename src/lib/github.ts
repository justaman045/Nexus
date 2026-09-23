import type { Product } from "./products";

export interface GitHubReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
}

export interface GitHubRepoData {
  owner: string;
  repo: string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  archived: boolean;
  avatarUrl: string;
  release: GitHubReleaseInfo | null;
  readme: string | null;
}

type MappedProductField = Pick<
  Product,
  "name" | "description" | "longDescription" | "version" | "imageUrl" | "documentationUrl" | "features" | "descriptionType"
>;

/** Display fields that a GitHub sync can (and does) populate. */
const DISPLAY_FIELDS = [
  "name",
  "description",
  "longDescription",
  "version",
  "imageUrl",
  "documentationUrl",
  "features",
  "descriptionType",
] as const;

export interface GitHubSnapshot {
  owner: string;
  repo: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  homepage: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  archived: boolean;
  avatarUrl: string;
  releaseTag: string | null;
  syncedAt: string;
  /** Values the last sync wrote into the product. Used to detect manual overrides. */
  lastMapped: Partial<MappedProductField>;
}

export interface ParsedRepo {
  owner: string;
  repo: string;
}

/** Accepts "owner/repo", "github.com/owner/repo", or "https://github.com/owner/repo". */
export function parseRepoInput(input: string): ParsedRepo | null {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  let owner: string | undefined;
  let repo: string | undefined;

  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/.*)?$/);
  if (urlMatch) {
    owner = urlMatch[1];
    repo = urlMatch[2];
  } else {
    const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
    if (shortMatch) {
      owner = shortMatch[1];
      repo = shortMatch[2];
    }
  }

  if (!owner || !repo) return null;
  if (/^gh-|^[-_.]|[-_.]$/.test(repo)) return null;
  if (owner.length > 39 || repo.length > 100) return null;
  const repoSlug = repo.replace(/\.git$/i, "");
  return { owner, repo: repoSlug };
}

/** Fetches repo metadata (+ release + README) through the server-side route. */
export async function fetchGitHubRepo(owner: string, repo: string, includeReadme = true): Promise<GitHubRepoData> {
  const params = new URLSearchParams({ owner, repo });
  if (includeReadme) params.set("readme", "1");
  const res = await fetch(`/api/github?${params.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error || `GitHub fetch failed (${res.status})`;
    throw new Error(message);
  }
  return body as GitHubRepoData;
}

/** Splits a repo slug into words for display, e.g. "preview-master" → "Preview Master". */
export function humanizeRepoName(repo: string): string {
  return repo
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Maps a fetched repo payload onto editable product fields (fresh values). */
export function mapRepoToProduct(data: GitHubRepoData): Partial<MappedProductField> {
  return {
    name: humanizeRepoName(data.repo),
    description: data.description || "",
    longDescription: data.readme || data.description || "",
    descriptionType: data.readme ? "markdown" : "plain",
    version: data.release ? data.release.tagName.replace(/^v/i, "") : undefined,
    imageUrl: data.avatarUrl,
    documentationUrl: data.homepage || data.htmlUrl,
    features: data.topics.slice(0, 6).map((t) => t.toLowerCase()),
  };
}

function buildSnapshot(data: GitHubRepoData): GitHubSnapshot {
  return {
    owner: data.owner,
    repo: data.repo,
    htmlUrl: data.htmlUrl,
    description: data.description,
    stars: data.stars,
    forks: data.forks,
    watchers: data.watchers,
    openIssues: data.openIssues,
    language: data.language,
    topics: data.topics,
    license: data.license,
    homepage: data.homepage,
    defaultBranch: data.defaultBranch,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    pushedAt: data.pushedAt,
    archived: data.archived,
    avatarUrl: data.avatarUrl,
    releaseTag: data.release ? data.release.tagName : null,
    syncedAt: new Date().toISOString(),
    lastMapped: {},
  };
}

/**
 * Merges freshly fetched repo data into the product form.
 * Populates fields the admin hasn't touched; preserves manual overrides.
 */
export function mergeSyncedWithManual(prev: Partial<Product>, data: GitHubRepoData): Partial<Product> {
  const mapped = mapRepoToProduct(data);
  const prevSnap = prev.github;
  const lastMapped = prevSnap?.lastMapped ?? {};

  const out: Partial<Product> = { ...prev, ...mapped };
  const snapshot = buildSnapshot(data);
  const finalMapped: Partial<MappedProductField> = {};

  for (const key of DISPLAY_FIELDS) {
    const oldSynced = lastMapped[key];
    const newVal = mapped[key];
    const current = prev[key];

    if (current === undefined || current === "" || current === oldSynced) {
      (out as Record<string, unknown>)[key] = newVal;
      (finalMapped as Record<string, unknown>)[key] = newVal;
    } else {
      (out as Record<string, unknown>)[key] = current;
      // Keep the previous source value so future syncs still honour the override.
      (finalMapped as Record<string, unknown>)[key] = oldSynced;
    }
  }

  out.github = snapshot;
  out.repoUrl = data.htmlUrl;
  snapshot.lastMapped = finalMapped;
  return out;
}

/** Removes the GitHub binding but leaves manually edited fields intact. */
export function disconnectRepo(product: Partial<Product>): Partial<Product> {
  const { github, repoUrl, ...rest } = product;
  void github;
  void repoUrl;
  return rest;
}