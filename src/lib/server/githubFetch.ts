import type { GitHubRepoData, GitHubReleaseInfo } from "@/lib/github";

const GITHUB_API = "https://api.github.com/repos";
const MAX_README_CHARS = 120_000;

interface RawOwner {
  login: string;
  avatar_url: string;
}

interface RawRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license: { spdx_id: string; name: string } | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  archived: boolean;
  owner: RawOwner;
}

interface RawRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
}

export class GitHubFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface GitHubFetchOptions {
  includeReadme?: boolean;
  force?: boolean;
}

/**
 * Server-side GitHub repository fetch (no /api round-trip, no next cache
 * involvement). Uses GITHUB_TOKEN when present for a higher rate limit.
 */
export async function fetchGitHubRepoServer(
  owner: string,
  repo: string,
  options: GitHubFetchOptions = {}
): Promise<GitHubRepoData> {
  const { includeReadme = true, force = false } = options;

  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new GitHubFetchError('Invalid repository. Use "owner/repo".', 400);
  }

  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const cacheOpts = force ? { cache: "no-store" as const } : { next: { revalidate: 600 } };
  const base = `${GITHUB_API}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const [repoRes, releaseRes, readmeRes] = await Promise.all([
    fetch(base, { headers, ...cacheOpts }),
    fetch(`${base}/releases/latest`, { headers, ...cacheOpts }).catch(() => null),
    includeReadme
      ? fetch(`${base}/readme`, {
          headers: new Headers({ ...Object.fromEntries(headers), Accept: "application/vnd.github.raw+json" }),
          ...cacheOpts,
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (repoRes.status === 404 || repoRes.status === 451) {
    throw new GitHubFetchError(`Repository ${owner}/${repo} not found.`, 404);
  }
  if (!repoRes.ok) {
    const limited = repoRes.status === 403 || repoRes.status === 429;
    throw new GitHubFetchError(
      limited
        ? "GitHub rate limit reached. Add a GITHUB_TOKEN to the environment for a higher limit, or try again later."
        : `GitHub API error (${repoRes.status}).`,
      limited ? 429 : 502
    );
  }

  const raw = (await repoRes.json()) as RawRepo;

  let release: GitHubReleaseInfo | null = null;
  if (releaseRes?.ok) {
    const r = (await releaseRes.json()) as RawRelease;
    release = { tagName: r.tag_name, name: r.name, publishedAt: r.published_at, htmlUrl: r.html_url };
  }

  let readme: string | null = null;
  if (readmeRes?.ok) {
    readme = ((await readmeRes.text()) || "").slice(0, MAX_README_CHARS);
  }

  return {
    owner,
    repo: raw.name || repo,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description ?? null,
    htmlUrl: raw.html_url,
    homepage: raw.homepage || null,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    watchers: raw.watchers_count,
    openIssues: raw.open_issues_count,
    language: raw.language ?? null,
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    license: raw.license?.spdx_id ?? null,
    defaultBranch: raw.default_branch,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
    archived: raw.archived,
    avatarUrl: raw.owner.avatar_url,
    release,
    readme,
  };
}