import { describe, expect, it } from "vitest";
import {
  humanizeRepoName,
  mergeSyncedWithManual,
  parseRepoInput,
} from "./github";
import type { GitHubRepoData, GitHubSnapshot } from "./github";

const baseData: GitHubRepoData = {
  owner: "vercel",
  repo: "next.js",
  name: "Next.js",
  fullName: "vercel/next.js",
  description: "The React framework",
  htmlUrl: "https://github.com/vercel/next.js",
  homepage: "https://nextjs.org",
  stars: 140000,
  forks: 25000,
  watchers: 140000,
  openIssues: 1000,
  language: "TypeScript",
  topics: ["react", "nextjs"],
  license: "MIT",
  defaultBranch: "canary",
  createdAt: "2016-10-05T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  pushedAt: "2026-01-02T00:00:00Z",
  archived: false,
  avatarUrl: "https://avatars.githubusercontent.com/u/14985020",
  release: { tagName: "v16.0.0", name: "16.0.0", publishedAt: "2025-10-03T00:00:00Z", htmlUrl: "https://github.com/vercel/next.js/releases/v16.0.0" },
  readme: "# Next.js\n\nThe React framework",
};

describe("parseRepoInput", () => {
  it("parses owner/repo", () => {
    expect(parseRepoInput("vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js" });
  });

  it("parses full URLs", () => {
    expect(parseRepoInput("https://github.com/vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js" });
    expect(parseRepoInput("github.com/vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js" });
  });

  it("strips .git suffixes and trailing slashes", () => {
    expect(parseRepoInput("vercel/next.js.git/")).toEqual({ owner: "vercel", repo: "next.js" });
  });

  it("rejects invalid input", () => {
    expect(parseRepoInput("")).toBeNull();
    expect(parseRepoInput("not-a-slug")).toBeNull();
    expect(parseRepoInput("gh-pages-branch")).toBeNull();
  });
});

describe("humanizeRepoName", () => {
  it("title-cases dashed repos", () => {
    expect(humanizeRepoName("preview-master")).toBe("Preview Master");
    expect(humanizeRepoName("react-dom")).toBe("React Dom");
  });
});

function snapshot(overrides: Partial<GitHubSnapshot> = {}): GitHubSnapshot {
  return {
    owner: "vercel",
    repo: "next.js",
    htmlUrl: "https://github.com/vercel/next.js",
    description: "The React framework",
    stars: 140000,
    forks: 25000,
    watchers: 140000,
    openIssues: 1000,
    language: "TypeScript",
    topics: ["react"],
    license: "MIT",
    homepage: null,
    defaultBranch: "canary",
    createdAt: "2016-10-05T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    pushedAt: "2026-01-02T00:00:00Z",
    archived: false,
    avatarUrl: "https://avatars.githubusercontent.com/u/14985020",
    releaseTag: "v16.0.0",
    syncedAt: "2026-01-01T00:00:00Z",
    lastMapped: { name: "Next.js", description: "The React framework" },
    ...overrides,
  };
}

describe("mergeSyncedWithManual", () => {
  it("populates empty fields from fresh GitHub data", () => {
    const prev: Partial<import("./products").Product> = { name: "", description: "" };
    const out = mergeSyncedWithManual(prev, baseData);
    expect(out.name).toBe("Next.js");
    expect(out.description).toBe("The React framework");
    expect(out.longDescription).toContain("# Next.js");
    expect(out.version).toBe("16.0.0");
    expect(out.repoUrl).toBe("https://github.com/vercel/next.js");
    expect(out.github?.stars).toBe(140000);
  });

  it("preserves manual overrides across re-syncs", () => {
    const prev = {
      name: "Custom Name",
      description: "Hand written description",
      github: snapshot(),
    };
    const out = mergeSyncedWithManual(prev, baseData);
    expect(out.name).toBe("Custom Name");
    expect(out.description).toBe("Hand written description");
    // Original mapped values are retained as reference for future syncs.
    expect(out.github?.lastMapped.name).toBe("Next.js");
  });

  it("re-applies GitHub values once a manual override is cleared", () => {
    const prev = {
      name: "Custom Name",
      github: snapshot({ lastMapped: { name: "Next.js", description: "The React framework" } }),
    };
    const out = mergeSyncedWithManual(prev, baseData);
    expect(out.name).toBe("Custom Name");
  });
});