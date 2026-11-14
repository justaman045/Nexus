// Single source of truth for the canonical site URL (metadata, sitemap,
// robots, default site settings). Override with NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nexusprods.vercel.app").replace(
  /\/+$/,
  ""
);
