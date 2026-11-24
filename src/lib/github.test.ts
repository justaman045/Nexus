import { describe, expect, it } from "vitest";
import {
  humanizeRepoName,
  mapRepoToProduct,
  mergeSyncedWithManual,
  parseRepoInput,
  rewriteReadmeUrls,
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

describe("rewriteReadmeUrls", () => {
  const rewrite = (readme: string) =>
    rewriteReadmeUrls(readme, "justaman045", "WealthSync", "master");

  it("points relative HTML images at the repository's raw content", () => {
    expect(rewrite('<img src="assets/app_logo.png" width="96"/>')).toBe(
      '<img src="https://raw.githubusercontent.com/justaman045/WealthSync/master/assets/app_logo.png" width="96"/>'
    );
  });

  it("points relative HTML links at the GitHub page", () => {
    expect(rewrite('<a href="CONTRIBUTING.md">Contributing</a>')).toBe(
      '<a href="https://github.com/justaman045/WealthSync/blob/master/CONTRIBUTING.md">Contributing</a>'
    );
  });

  it("points relative markdown images at the raw content", () => {
    expect(rewrite("![logo](./assets/logo.png)")).toBe(
      "![logo](https://raw.githubusercontent.com/justaman045/WealthSync/master/assets/logo.png)"
    );
  });

  it("points relative markdown links at the GitHub page", () => {
    expect(rewrite("See [CONTRIBUTING.md](CONTRIBUTING.md)")).toBe(
      "See [CONTRIBUTING.md](https://github.com/justaman045/WealthSync/blob/master/CONTRIBUTING.md)"
    );
  });

  it("leaves absolute URLs, anchors and protocols alone", () => {
    const readme =
      '<img src="https://example.com/a.png"/><a href="#section">x</a><a href="mailto:a@b.c">m</a>';
    expect(rewrite(readme)).toBe(readme);
  });

  it("does not rewrite a markdown image as a link", () => {
    expect(rewrite("![a](b.png)")).toContain("raw.githubusercontent.com");
    expect(rewrite("![a](b.png)")).not.toContain("blob/master");
  });
});

describe("mapRepoToProduct", () => {
  it("rewrites the relative URLs in the readme", () => {
    const out = mapRepoToProduct({
      ...baseData,
      readme: '<img src="assets/logo.png"/>',
    });
    expect(out.longDescription).toBe(
      '<img src="https://raw.githubusercontent.com/vercel/next.js/canary/assets/logo.png"/>'
    );
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