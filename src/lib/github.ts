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

/** True when a URL points somewhere inside the repository. */
function isRelativeRepoUrl(url: string): boolean {
  if (!url) return false;
  // Anchors stay on the page.
  if (url.startsWith("#")) return false;
  // Protocol-relative and absolute URLs are already resolved.
  if (url.startsWith("//")) return false;
  // Anything with a scheme (`https:`, `mailto:`, `data:`) is absolute.
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return false;
  return true;
}

/** Strips the `./` or leading `/` from a repository-relative path. */
function repoPath(url: string): string {
  return url.replace(/^\.\//, "").replace(/^\//, "");
}

/**
 * Rewrites the relative URLs in a README so they still resolve when the
 * README is rendered on this site.
 *
 * A README that is shown on another site cannot resolve its relative paths:
 * `assets/logo.png` would be looked up on *this* site and 404. Images are
 * pointed at the repository's raw content and links at the GitHub page.
 */
export function rewriteReadmeUrls(readme: string, owner: string, repo: string, branch: string): string {
  if (!readme) return readme;
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  const blob = `https://github.com/${owner}/${repo}/blob/${branch}/`;

  // Markdown images: ![alt](path "title") — the path may carry a title.
  let out = readme.replace(
    /!\[([^\]]*)\]\(\s*([^)\s]+)((?:\s+"[^"]*")?)\s*\)/g,
    (match, alt: string, url: string, title: string) => {
      if (!isRelativeRepoUrl(url)) return match;
      return `![${alt}](${raw}${repoPath(url)}${title})`;
    }
  );

  // Markdown links: [text](path "title")
  out = out.replace(
    /(^|[^!])\[([^\]]*)\]\(\s*([^)\s]+)((?:\s+"[^"]*")?)\s*\)/g,
    (match, prefix: string, text: string, url: string, title: string) => {
      if (!isRelativeRepoUrl(url)) return match;
      return `${prefix}[${text}](${blob}${repoPath(url)}${title})`;
    }
  );

  // Raw HTML: src="path" (an asset) and href="path" (a page in the repo).
  out = out.replace(
    /(\ssrc=)(["'])([^"']+)\2/g,
    (match, prefix: string, quote: string, url: string) => {
      if (!isRelativeRepoUrl(url)) return match;
      return `${prefix}${quote}${raw}${repoPath(url)}${quote}`;
    }
  );
  out = out.replace(
    /(\shref=)(["'])([^"']+)\2/g,
    (match, prefix: string, quote: string, url: string) => {
      if (!isRelativeRepoUrl(url)) return match;
      return `${prefix}${quote}${blob}${repoPath(url)}${quote}`;
    }
  );

  return out;
}

/** Maps a fetched repo payload onto editable product fields (fresh values). */
export function mapRepoToProduct(data: GitHubRepoData): Partial<MappedProductField> {
  const readme = data.readme
    ? rewriteReadmeUrls(data.readme, data.owner, data.repo, data.defaultBranch)
    : "";
  return {
    name: humanizeRepoName(data.repo),
    description: data.description || "",
    longDescription: readme || data.description || "",
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
    } else if (Array.isArray(current) && Array.isArray(oldSynced)
      ? JSON.stringify(current) === JSON.stringify(oldSynced)
      : current === oldSynced) {
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