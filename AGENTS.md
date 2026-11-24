# Nexus — Agent Guide

Next.js 16 (App Router) software marketplace: Firebase web SDK for client reads; Firestore Admin SDK for money/fulfillment writes server-side. Payments: Razorpay (INR) or Stripe Checkout, active gateway chosen at runtime from Firestore settings.

## Commands

```bash
npm install        # npm only — never pnpm (package-lock.json is the only lockfile; Vercel detects lockfiles)
npm run dev        # Next dev server
npm run build      # prod build (Next typechecks during build)
npm run lint       # ESLint 9 flat config (eslint.config.mjs)
npm test           # Vitest — runs src/**/*.test.ts (pass a path to vitest for a single file)
npm run test:rules # Firestore emulator suite for the SHARED firestore.rules (both apps' collections)
npx tsc --noEmit   # standalone typecheck
```

CI (`.github/workflows/ci.yml`): `npm ci → lint → tsc → test → build` on push/PR to `main` (Node 22). Run locally in that order before pushing. `npm run test:rules` is **not** in CI — run it manually before every `firebase deploy --only firestore`.

## Setup

Node 22 — CI runs on Node 22; use it locally for `tsc`, `build`, and `test`.

1. Copy `.env.example` → `.env.local`. `.env.example` is the authoritative variable list; all other `.env*` files are gitignored.
2. `FIREBASE_SERVICE_ACCOUNT` (JSON service account) is required — `getDb()` throws at request time without it.
3. Install `firebase-tools` globally to deploy Firestore rules: `firebase deploy --only firestore` (manual; editing `firestore.rules` does nothing until deployed). `.firebaserc` pins the target project to `company-24267`.
4. `vercel` CLI is a devDependency: `npx vercel` to deploy/add env, `npx vercel ls --prod` to list production deployments. Git push auto-deploys Production. `vercel env add` overwrites existing values.

## Shared Firebase project — SaaSWaitlist

Nexus (`nexusprods.vercel.app`, Vercel project `company`) and SaaSWaitlist (`projektnotify.vercel.app`, Vercel project `saas-waitlist`) share the **same** Firebase project `company-24267`. The other app's repo lives at `~/Development/SaaSWaitlist`.

- **`firestore.rules` is shared and a deploy replaces the whole file.** It must keep BOTH apps' collections: Nexus owns `products`, `content`, `settings`, `contacts`, `orders`, `licenses`; SaaSWaitlist owns `projects`, `waitlist`, `taxonomy`, `requests`. Never deploy a Nexus-only rules file — the catch-all `match /{document=**} { allow read, write: if false; }` would silently deny the other app's collections and break its landing page, waitlist signup, dropdowns and request submission.
- **`isAdmin()` is a cross-app contract.** The email list in `firestore.rules` must be the union of both apps' admins, and stay in sync with `NEXT_PUBLIC_ADMIN_EMAILS` in both repos. The cross-app product sync authenticates as `developerlife69@gmail.com`.
- **Cross-origin calls:** the SaaSWaitlist admin mirrors products into Nexus. `src/lib/cors.ts` `DEFAULT_ORIGINS` lists both production origins; `ALLOWED_ORIGINS` (Vercel env) extends it for preview deployments. Without the origin in the list the browser blocks the response — the API still returns 200 server-side, so this looks like an empty result rather than an error.
- **Mirrored products:** SaaSWaitlist `projects` are mirrored into Nexus `products` via `POST /api/products` using the companion schema (`title`/`pricing`/`websiteUrl`/`techStack`); Nexus `POST /api/products` accepts both schemas. A mirrored product is only `live` when the source project is `active`.
- **A mirrored product with a free-text pricing is free.** The companion maps a non-numeric `pricing` ("Free", "Freemium") to `price: 0`. Nexus renders that as "Free" (`isFreeProduct()` in `src/lib/currency.ts`) and replaces the acquire button with a notice — the payment routes reject a zero amount, so a checkout for a free product can only ever fail.
- `userProfiles` / `users` are orphaned legacy collections — neither app references them; the catch-all deny is correct, do not add rules for them.

## Firestore rules — testing and deployment

`firestore.rules` is shared with the companion app, so a rules change can break either app. Three layers of checking:

```bash
npm run test:rules                              # emulator suite, 80 assertions over BOTH apps' collections
node scripts/verify-deployed-rules.mjs          # proves the rules SERVING production match the file
node scripts/production-state.mjs               # collection counts, orphaned licences, mirror links
firebase deploy --only firestore                # deploys to company-24267 (.firebaserc pins the target)
```

- `scripts/verify-firestore-rules.mjs` runs against the local Firestore emulator (`firebase.json` → emulators on ports 8288/9299, project `demo-nexus`). It seeds an admin and a customer in the Auth emulator and asserts every read/write path of both apps. Note: `firebase emulators:exec` loads the script with `require()`, so the entry point is the `.cjs` shim.
- The emulator's REST `PATCH` **replaces** the document (no merge) and rejects `updateMask` — partial updates have to resend the whole document. The suite treats HTTP 400 as a malformed request (a failed test), never as a denial.
- `scripts/verify-deployed-rules.mjs` signs in as the admin through a real ID token and re-runs the key assertions against the live project. It creates and deletes its own probe documents.
- `scripts/production-state.mjs` prints the live collection counts, the auth users, any licence whose product no longer exists, and whether each companion project is correctly linked to its mirrored product. It also deletes leftover probe documents.
- `scripts/restore-catalogue.mts` restores the catalogue data (the deleted "Finance Control" product, the companion mirror, and the `settings/site` document). It is idempotent — safe to re-run.

Always re-run `npm run test:rules` after editing `firestore.rules`, and keep `~/Development/SaaSWaitlist/firestore.rules` byte-identical to this repo's copy (a rules deploy replaces the whole file).

## Architecture

- All pages are `"use client"` except root `layout.tsx`, `admin/page.tsx` (server redirect to `/admin/dashboard`), and metadata routes (`sitemap.ts`, `robots.ts`). Flat app under `src/app` (no route groups); alias `@/*` → `./src/*`.
- Server-only code lives in `src/lib/server/` — never import `firebase-admin` into `"use client"` code. `getDb()` (`src/lib/server/firebase.ts`) initializes the Admin app from `FIREBASE_SERVICE_ACCOUNT` and throws if unset.
- `firebase-admin/auth` is unusable in route handlers (`ERR_REQUIRE_ESM` under Turbopack). Verify Firebase ID tokens with `src/lib/server/verifyIdToken.ts` (manual RS256 vs Google JWKS, 1 h key cache with refetch on `kid` miss, `AbortSignal.timeout`), then check `claims.emailVerified === true` and the email against `NEXT_PUBLIC_ADMIN_EMAILS`. Client admin routes send `Authorization: Bearer <await user.getIdToken()>` (see `admin/settings/page.tsx`).
- `src/lib/firebase.ts` uses `?? "not-configured-..."` placeholder defaults so CI builds with no secrets — never add bare `process.env.X!` reads in client code.
- Theme: HSL CSS vars in `src/app/globals.css` (`:root`/`.dark`) consumed by `tailwind.config.ts` — a token change touches both files.
- `metadataBase`, `sitemap.ts`, and `robots.ts` all derive from `src/lib/siteUrl.ts` (`NEXT_PUBLIC_SITE_URL`, default `https://nexusprods.vercel.app`). `nexusprods.vercel.app` appears only in `src/lib/cors.ts` allowed origins, not in sitemap/robots. Admin layout (`src/app/admin/layout.tsx`) forces dark theme.

## Payments — security conventions (must follow for any payment touchpoint)

- **Never trust client-supplied price/amount.** The client only sends `productId` (+ optional currency). `/api/razorpay` and `/api/stripe` load the product server-side (`products/{productId}`) and compute the chargeable amount from `product.price` × server FX rate (`src/lib/server/currency.ts`, `usdToMinorUnits()`). Client `amount` is ignored.
- **Gateway enforcement is server-side.** `/api/razorpay` and `/api/stripe` read `settings/payment` and 503 if the requested gateway is not the active one. Switching the gateway in `/admin/settings` is blocked unless `/api/admin/gateway-health` reports the target as configured.
- **Server-authoritative amount verification.** `/api/razorpay/verify`, `/api/stripe/verify`, and `/api/stripe/webhook` recompute the expected amount from the product's USD price and reject (400) on mismatch.
- **Idempotency keyed on `gateway`+`orderId`.** `fulfillVerifiedOrder()` (`src/lib/server/fulfill.ts`) uses deterministic doc IDs (`gateway_orderId`, `lic_gateway_orderId`) inside a Firestore `runTransaction`, so concurrent verify+webhook calls cannot create duplicate orders/licenses or double-increment `purchases`. License key `XXXX-XXXX-XXXX-XXXX` generated server-side.
- **Razorpay verify must confirm capture.** After the HMAC check, fetch the payment and assert `status === "captured"`, `payment.order_id === orderId`, and captured amount matches order amount before fulfilling. Read `productId` from `order.notes.productId`, not `receipt` (truncated to 40 chars).
- **Fulfillment is Admin SDK only.** `fulfillVerifiedOrder()` writes `orders` + `licenses` and `purchases: increment(1)`. Browsers cannot write `orders`/`licenses` (Firestore rules deny client read and write); customer lookup goes through authenticated server routes scoped by email.
- Gateway env var lists: razorpay = `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `NEXT_PUBLIC_RAZORPAY_KEY_ID`; stripe = `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. Set all in Vercel before switching. Readiness is exposed by `/api/admin/gateway-health`.
- GitHub sync: `GET /api/github` proxies GitHub (10-min revalidate, `?force=1`); Vercel Cron `0 2 * * *` hits `POST /api/github/sync-all` (`CRON_SECRET` **required** — fail closed with 503 if unset), re-fetching products with `repoUrl` via `mergeSyncedWithManual` (manual overrides preserved).

## Caching (client-side)

| Data | TTL | Notes |
|---|---|---|
| Products | 5 min | cleared on write in `products.ts`; `getProducts()` falls back to `MOCK_PRODUCTS`, which is **empty by design** — an unreachable API yields an empty catalogue, not a sample one |
| Orders | 5 min | read-only |
| Site settings / CMS | 5 min | cleared on write; deep-merged over hardcoded `defaultSiteSettings` |
| Payment settings | 30 s | controls gateway + multi-currency |
| FX rates | 1 h | server cache with hardcoded fallback rates offline |
| Geo/IP | session | `sessionStorage.nx_geo` |
| GET /api/github | 10 min | Next data cache; `?force=1` bypasses |

## Gotchas

- `firestore.rules` `isAdmin()` hardcodes `developerlife69@gmail.com` + `email_verified == true`; client-side `isAdminEmail()` (`src/lib/admin.ts`) reads `NEXT_PUBLIC_ADMIN_EMAILS` (empty = any signed-in user is admin, legacy). Keep both in sync — and keep the rules list the union across both apps (see *Shared Firebase project*).
- `orders`/`licenses` are admin-read-only (`allow read: if isAdmin()`); client writes are denied (`allow write: if false`). Don't add client reads of these collections — scope lookups via server routes.
- Keep only `package-lock.json` — a stray `pnpm-lock.yaml` makes Vercel switch package managers and break the deploy.
- Next bundles its own postcss; `package.json` `overrides` pins it past a CVE — if Next's pin bumps, re-run `npm audit` and reconcile.
- AI instruction files (`CLAUDE.md`, `GEMINI.md`, `skills/`, `graphify-out/`) are gitignored — don't commit them.

## Security gotchas

- **Server-side price authority is non-negotiable.** Any new payment route must recompute the chargeable amount from `products/{id}.price` and reject mismatches. Do not accept `amount` from the client body.
- **`verifyIdToken` refetches JWKS on a `kid` miss** — don't cache signing keys longer than 1 h without a refetch-on-miss path; always use `AbortSignal.timeout` on the JWKS fetch. Always check `claims.emailVerified === true` on server-side admin gates.
- **`/api/admin/gateway-health` fails closed:** empty allowlist → 503; unverified or missing email → 403. Admin routes expect `Authorization: Bearer <id token>`.
- **`contacts` requires auth + field limits** — `allow create` is gated on `request.auth != null` with string type/size checks (name ≤200, email ≤200, subject ≤200, message ≤5000). Move contact submission to a validated server route for rate limiting.
- **`/api/github/sync-all` requires `CRON_SECRET`** — unset = 503. Don't make state-mutating cron endpoints publicly reachable.

## Checkout fallback convention

`processRazorpay`/`processStripe` return `"ok" | "error" | "fallback"`; `handleCheckout` retries the other gateway once on `"fallback"`. Don't let the two processors call each other.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
