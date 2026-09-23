# Nexus — Agent Guide

Next.js 16 (App Router) software marketplace. Client-facing reads use Firebase web SDK; **money/fulfillment writes happen server-side via the Firestore Admin SDK**. Payments via Razorpay (inline modal, INR-only) or Stripe (Checkout Session redirect), gateway chosen at runtime from Firestore.

## Commands

```bash
npm install        # ONLY npm — never pnpm (see Vercel gotcha)
npm run dev        # → http://localhost:3000
npm run build      # prod build; runs tsc/typecheck automatically
npm run lint       # ESLint 9 flat config (eslint.config.mjs)
npm test           # Vitest — src/**/*.test.ts (currency, github merge, razorpaySig, gatewayConfig)
npx tsc --noEmit   # standalone typecheck if you skip a full build
# CI (.github/workflows/ci.yml): npm ci → lint → tsc → test → build on every push/PR
```

Env: copy `.env.example` → `.env.local`. `.env.example` is the authoritative list (`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_ADMIN_EMAILS`, `GITHUB_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, `RAZORPAY_KEY_ID/SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`). **Server-only routes throw at request time if `FIREBASE_SERVICE_ACCOUNT` or their gateway-secret env is missing.**
Also install globally for local tests: `firebase-tools` (`firebase deploy --only firestore` — the repo ships `firestore.rules` + `firebase.json`, deploy step is manual/human-run).
Local dev + App Tooling: `vercel` CLI is a devDependency — use `npx vercel` for env/deploy (linked project `aman-ojhas-projects/company`). Git push auto-deploys Production; list with `npx vercel ls --prod`.

## Architecture

- **All pages are `"use client"`** except root `layout.tsx`, the server redirect in `admin/page.tsx`, and the metadata routes (`sitemap.ts`, `robots.ts`). No middleware — admin auth is client-side `onAuthStateChanged` in `admin/layout.tsx` + email allowlist (`src/lib/admin.ts`).
- **Single flat app**: no route groups in `src/app`. Import alias `@/*` → `./src/*`.
- **Version pins**: Next `16.3.5`, React `19.2.3`, Stripe SDK `22.1.0` with `apiVersion: "2026-04-22.dahlia"`. `firebase-admin` is server-only (never import it into `"use client"` code) — and `firebase-admin/auth` is unusable in route handlers (see Gotchas). npm `overrides` bumps Next's bundled `postcss` past a CVE.
- **Payment flow** (gateway + `multiCurrencyEnabled` read from `settings/payment` doc, TTL 30 s, fallback gateway = razorpay):
  - **Razorpay**: client converts the USD price to INR (`convertTo("INR", …)` — Razorpay is INR-only), `POST /api/razorpay` creates an order with `receipt = productId`. Client opens the modal, then `POST /api/razorpay/verify` HMAC-checks the signature and — server-side — fetches the order for authoritative amount/currency, then falls through to fulfillment. Non-INR currencies never hit this path.
  - **Stripe**: `POST /api/stripe` creates a Checkout Session (metadata carries productId/customer); the client stashes `sessionStorage.stripe_pending` and returns to `/orders?stripe_session_id=...`, which calls `GET /api/stripe/verify?session_id=`. `POST /api/stripe/webhook` (`checkout.session.completed`) is the authoritative duplicate-source for buyers who never return; signature-checked via `STRIPE_WEBHOOK_SECRET`.
  - **Fulfillment** lives in `src/lib/server/fulfill.ts` → `fulfillVerifiedOrder()`: writes `orders` + `licenses` docs and `purchases: increment(1)` with the Admin SDK, **idempotent on `paymentId`**. Browsers hold zero write capability over these collections (Firestore rules). License key format `XXXX-XXXX-XXXX-XXXX`, generated server-side.
  - **Switching gateways**: runtime switch in `/admin/settings` → `setPaymentGateway()` writes `settings/payment`. All gateway env must be in **Vercel** before switching (razorpay = `RAZORPAY_KEY_ID`+`RAZORPAY_KEY_SECRET`+`NEXT_PUBLIC_RAZORPAY_KEY_ID`; stripe = `STRIPE_SECRET_KEY`+`STRIPE_WEBHOOK_SECRET`). The UI blocks switching to a gateway whose env is unset and shows a readiness badge from `GET /api/admin/gateway-health`. Defense-in-depth: `/api/stripe` and `/api/razorpay` return `503 {code:"gateway_not_configured"}` when env is missing and the checkout handler retries via the other gateway once.
  - **GitHub sync**: `GET /api/github` proxies the GitHub API (`src/lib/server/githubFetch.ts`, `GITHUB_TOKEN` optional, 10-min revalidate, `?force=1` bypass). Vercel Cron (`vercel.json`, daily 02:00 UTC — Hobby plan caps cron at 1/day) hits `POST /api/github/sync-all` (guarded by `CRON_SECRET` Bearer when set) which re-fetches every product with a `repoUrl` and writes back via `mergeSyncedWithManual` (manual overrides preserved).
- **Admin API guard**: server routes that gate on the logged-in admin (e.g. `src/app/api/admin/gateway-health`) verify the client's Firebase ID token (`Authorization: Bearer <idToken>`, from `auth.currentUser.getIdToken()`) with `verifyIdToken()` in `src/lib/server/verifyIdToken.ts` — **do NOT use `firebase-admin/auth` in route handlers** (see Gotchas) — then check the email against `NEXT_PUBLIC_ADMIN_EMAILS`.
- **Firestore security**: `firestore.rules` = public reads on `products`/`content`/`settings`; `contacts` is create-only; `orders`/`licenses` are read-public / write-denied (Admin SDK only); generic catch-all deny. Admin-role writes (products/content/settings from the admin UI) require `request.auth.token.email` in the ADMINS email list inside `isAdmin()` in `firestore.rules` (top-level `const` arrays are rejected by the Rules compiler) — keep in sync with `NEXT_PUBLIC_ADMIN_EMAILS`.
- **Geo/currency** (`src/lib/currency.ts`): IP lookup via `ipapi.co` (4 s timeout → `sessionStorage.nx_geo`) with timezone fallback onto a hardcoded `COUNTRY_CURRENCY` map; FX rates from `open.er-api.com/v6/latest/USD` (5 s timeout → `localStorage.nx_rates`, 1 h TTL) with hardcoded fallback rates. `CurrencyProvider` caches the rate map and exposes `convert`/`convertTo`/`rates`.
- **Theme tokens**: Shadcn-style HSL CSS vars in `globals.css` (`:root`/`.dark`), consumed by `tailwind.config.ts` via the `@config` directive — non-default Tailwind v4 setup, so a token change touches both files.
- **Product detail** renders `longDescription` through `react-markdown` + `remark-gfm`; `descriptionType` is `"plain" | "markdown" | "html"`.

## Caching (client-side, in-memory unless noted)

| Data | TTL | Notes |
|---|---|---|
| Products | 5 min | cleared on write in `products.ts` |
| Orders | 5 min | read-only cache |
| Site settings, CMS content | 5 min | cleared on write |
| Payment settings | 30 s | controls gateway + multi-currency |
| FX rates | 1 h | `localStorage.nx_rates` |
| Geo/IP | session | `sessionStorage.nx_geo` |
| GitHub /api/github route | 10 min | Next data cache; `?force=1` bypasses |

## Gotchas

- **Mock fallbacks**: `getProducts()` returns hardcoded data when the `products` collection is empty or Firestore is unreachable; `getHomepageContent()` and `getSiteSettings()` deep-merge stored data over hardcoded defaults. App renders fine with no backend — don't mistake mock data for real data.
- **Rules deploy is manual**: editing `firestore.rules` does nothing until deployed. Use `firebase deploy --only firestore` from an account with access to the project (the CLI ignores `GOOGLE_APPLICATION_CREDENTIALS` for this — it uses the saved login), or the Rules REST API with a service-account token (`POST /v1/projects/<p>/rulesets` then `PATCH /v1/projects/<p>/releases/cloud.firestore` with a nested `{release:{rulesetName}}` body). The verified-payment write path breaks if rules are stricter than the shapes `fulfill.ts` produces.
- **Split domains**: `metadataBase` in `layout.tsx` = `https://nexusprods.vercel.app`; sitemap/robots use `https://nexus-software.com`.
- **Admin layout forces dark theme** via inline `style={{ background: "#05050f" }}` (`admin/layout.tsx`).
- **Keep only `package-lock.json`** — the Vercel bot auto-creates PRs with pnpm by default, and a stray `pnpm-lock.yaml` makes Vercel switch package managers and break the deploy. Always `npm install`.
- **Next bundles its own postcss** — the `overrides` entry in `package.json` keeps it patched; if Next bumps its pin, re-run `npm audit` and reconcile.
- **`firebase-admin/auth` breaks in route handlers**: under Next 16 Turbopack serverless builds the external module is loaded with `require()`, and `firebase-admin/auth` → `jwks-rsa` → `jose` is ESM-only → runtime `ERR_REQUIRE_ESM` (route 500s). Verify Firebase ID tokens with `src/lib/server/verifyIdToken.ts` instead: manual RS256 check with `node:crypto` against Google's securetoken JWKS (`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`, 1 h key cache), `aud`/`iss` tied to the `project_id` parsed from `FIREBASE_SERVICE_ACCOUNT`. Feel free to extend for non-admin use.
- **`react-hooks/immutability` (eslint)**: in `"use client"` components, assigning globals like `window.location.href` inside mutually-recursive local async fns (A calls B, B calls A) trips `Modifying a variable defined outside a component or hook is not allowed`. Keep checkout-fallback orchestration in the submit handler: have `processRazorpay`/`processStripe` return `"ok" | "error" | "fallback"` and let `handleCheckout` retry — don't let the two processors call each other.
- **Env-free builds**: `src/lib/firebase.ts` must keep non-empty placeholder defaults for `NEXT_PUBLIC_FIREBASE_*` (e.g. `?? "not-configured-api-key"`). CI has no secrets; an env var set to `""`/undefined makes `next build` prerender of `/` and `/_not-found` throw `auth/invalid-api-key`. Same class of bug as the gateway env: never add bare reads of `process.env.X!` in client code.
- **Vercel**: `vercel` CLI is a devDependency — `npx vercel ls --prod` lists deployments, and git push auto-deploys Production (deployment URLs `https://company-<hash>-aman-ojhas-projects.vercel.app`). Raw deployment URLs redirect to Vercel SSO for `curl` (302 → login HTML) — probe the canonical alias `https://nexusprods.vercel.app` instead. `vercel env add` overwrites existing values; the Dependabot alerts on the default branch (8 high/10 moderate in devDeps) come from `vercel`'s dev tree — the shipped app audits clean.
- **Pushing**: repo pushes via HTTPS + gh credential helper (`gh auth setup-git`). If `git push` hangs, re-run `gh auth setup-git`.
- **Local AI config** (`CLAUDE.md`, `GEMINI.md`, `skills/`, `graphify-out/`) is gitignored. `fix_buttons.js` / `refactor_theme.js` and `dist/*.skill` were deleted in the security pass.