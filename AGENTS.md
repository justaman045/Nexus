# Nexus — Agent Guide

Next.js 16 (App Router) software marketplace: Firebase web SDK for client reads; Firestore Admin SDK for money/fulfillment writes server-side. Payments: Razorpay (INR) or Stripe Checkout, active gateway chosen at runtime from Firestore settings.

## Commands

```bash
npm install        # npm only — never pnpm (package-lock.json is the only lockfile; Vercel detects lockfiles)
npm run dev        # http://localhost:3000
npm run build      # prod build (Next typechecks during build)
npm run lint       # ESLint 9 flat config (eslint.config.mjs)
npm test           # Vitest — runs src/**/*.test.ts (pass a path to vitest for a single file)
npx tsc --noEmit   # standalone typecheck
npx vitest run src/lib/currency.test.ts   # single test file
```

CI (`.github/workflows/ci.yml`): `npm ci → lint → tsc → test → build` on push/PR to `main` (Node 22). Run locally in that order before pushing.

## Setup

Node 22 — CI (`.github/workflows/ci.yml`) runs on Node 22; use it locally for `tsc`, `build`, and `test`.

1. Copy `.env.example` → `.env.local`. `.env.example` is the authoritative variable list; all other `.env*` files are gitignored.
2. `FIREBASE_SERVICE_ACCOUNT` (JSON service account) is required — server routes throw at request time without it.
3. Install `firebase-tools` globally to deploy Firestore rules: `firebase deploy --only firestore` (manual; editing `firestore.rules` does nothing until deployed).
4. `vercel` CLI is a devDependency: `npx vercel` to deploy/add env, `npx vercel ls --prod` to list production deployments. Git push auto-deploys Production. `vercel env add` overwrites existing values.

## Architecture

- All pages are `"use client"` except root `layout.tsx`, `admin/page.tsx` (server redirect to `/admin/dashboard`), and metadata routes (`sitemap.ts`, `robots.ts`). Flat app under `src/app` (no route groups); alias `@/*` → `./src/*`.
- Server-only code lives in `src/lib/server/` — never import `firebase-admin` into `"use client"` code. `getDb()` (`src/lib/server/firebase.ts`) initializes the Admin app from `FIREBASE_SERVICE_ACCOUNT` and throws if unset.
- `firebase-admin/auth` is unusable in route handlers (`ERR_REQUIRE_ESM` under Turbopack). Verify Firebase ID tokens with `src/lib/server/verifyIdToken.ts` (manual RS256 vs Google JWKS, 1 h key cache with refetch on `kid` miss, `AbortSignal.timeout`), then check `claims.emailVerified === true` and the email against `NEXT_PUBLIC_ADMIN_EMAILS`. Client admin routes send `Authorization: Bearer <await user.getIdToken()>` (see `admin/settings/page.tsx`).
- `src/lib/firebase.ts` uses `?? "not-configured-..."` placeholder defaults so CI builds with no secrets — never add bare `process.env.X!` reads in client code.
- Theme: HSL CSS vars in `src/app/globals.css` (`:root`/`.dark`) consumed by `tailwind.config.ts` via `@config` — a token change touches both files.
- Split domains: `metadataBase` = `https://nexusprods.vercel.app` (`layout.tsx`); sitemap/robots use `https://nexus-software.com`. Admin layout forces dark theme.

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
| Products | 5 min | cleared on write in `products.ts`; `getProducts()` falls back to hardcoded `MOCK_PRODUCTS` when Firestore is empty/unreachable |
| Orders | 5 min | read-only |
| Site settings / CMS | 5 min | cleared on write; deep-merged over hardcoded `defaultSiteSettings` |
| Payment settings | 30 s | controls gateway + multi-currency |
| FX rates | 1 h | server cache with hardcoded fallback rates offline |
| Geo/IP | session | `sessionStorage.nx_geo` |
| GET /api/github | 10 min | Next data cache; `?force=1` bypasses |

## Gotchas

- `firestore.rules` `isAdmin()` hardcodes `developerlife69@gmail.com` + `email_verified == true`; client-side `isAdminEmail()` (`src/lib/admin.ts`) reads `NEXT_PUBLIC_ADMIN_EMAILS` (empty = any signed-in user is admin, legacy). Keep both in sync.
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
