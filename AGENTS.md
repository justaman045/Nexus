# Nexus — Agent Guide

Next.js 16 (App Router) software marketplace: Firebase web SDK for client reads; Firestore Admin SDK for money/fulfillment writes server-side. Payments: Razorpay (INR-only modal) or Stripe Checkout, gateway chosen at runtime from Firestore.

## Commands

```bash
npm install        # npm only — never pnpm (Vercel lockfile detection; pnpm-lock.yaml breaks deploy)
npm run dev        # http://localhost:3000
npm run build      # prod build (Next typechecks during build)
npm run lint       # ESLint 9 flat config (eslint.config.mjs)
npm test           # Vitest — src/**/*.test.ts
npx tsc --noEmit   # standalone typecheck
npx vitest run src/lib/currency.test.ts   # single file
```

CI (`.github/workflows/ci.yml`): `npm ci → lint → tsc → test → build` on push/PR to `main` (Node 22).

## Setup

1. Copy `.env.example` → `.env.local`. `.env.example` is the authoritative variable list; `.env*` is gitignored (`.env.example` excepted).
2. `FIREBASE_SERVICE_ACCOUNT` is required — server routes throw at request time without it.
3. Install `firebase-tools` globally to deploy Firestore rules: `firebase deploy --only firestore` (manual; rules edits do nothing until deployed).
4. `vercel` CLI is a devDependency: `npx vercel` for env/deploy, `npx vercel ls --prod` to list deployments. Git push auto-deploys Production (Vercel project `company`).

## Architecture

- All pages are `"use client"` except root `layout.tsx`, `admin/page.tsx` (server redirect), and metadata routes (`sitemap.ts`, `robots.ts`). No middleware — admin auth is client-side `onAuthStateChanged` + `NEXT_PUBLIC_ADMIN_EMAILS` allowlist (`src/lib/admin.ts`).
- Flat app under `src/app` (no route groups); alias `@/*` → `./src/*`. Server-only code lives in `src/lib/server/` — never import `firebase-admin` into `"use client"` code.
- `firebase-admin/auth` is unusable in route handlers (`ERR_REQUIRE_ESM` under Turbopack). Verify Firebase ID tokens with `src/lib/server/verifyIdToken.ts` (manual RS256 vs Google JWKS, 1 h key cache), then check the email against `NEXT_PUBLIC_ADMIN_EMAILS`. Client side, admin routes expect `Authorization: Bearer <await user.getIdToken()>` (see `admin/settings/page.tsx`).
- `src/lib/firebase.ts` uses non-empty placeholder defaults (`?? "not-configured-..."`) so CI builds with no secrets — never add bare `process.env.X!` reads in client code; a missing var breaks prerender of `/` and `/_not-found` with `auth/invalid-api-key`.
- Theme: HSL CSS vars in `src/app/globals.css` (`:root`/`.dark`) consumed by `tailwind.config.ts` via `@config` — a token change touches both files.
- Split domains: `metadataBase` = `https://nexusprods.vercel.app`; sitemap/robots use `https://nexus-software.com`. Admin layout forces dark theme (`admin/layout.tsx`).

## Payments — security conventions (must follow for any payment touchpoint)

- **Never trust client-supplied price/amount.** The client only sends `productId` (+ optional currency). Both `/api/razorpay` and `/api/stripe` load the product server-side (`products/{productId}`) and compute the chargeable amount from `product.price` × a server-side FX rate via `src/lib/server/currency.ts` (`usdToMinorUnits()`). Client `amount` is ignored. Razorpay carries `productId` in `order.notes.productId` (not `receipt`, which is truncated to 40 chars).
- **Gateway enforcement is server-side.** `/api/razorpay` and `/api/stripe` read `settings/payment` and 503 if the requested gateway is not the active one. Switching the gateway in `/admin/settings` is blocked unless `/api/admin/gateway-health` reports the target as configured.
- **Server-authoritative amount verification.** `/api/razorpay/verify`, `/api/stripe/verify`, and `/api/stripe/webhook` recompute the expected amount from the product's USD price and reject (400) if the charged `amount_total`/`order.amount` doesn't match.
- **Idempotency keyed on `gateway`+`orderId`, not `paymentId`.** `fulfillVerifiedOrder()` uses deterministic doc IDs (`gateway_orderId` for orders, `lic_gateway_orderId` for licenses) inside a Firestore `runTransaction`, so concurrent verify+webhook calls for the same payment cannot create duplicate orders/licenses or double-increment `purchases`.
- **Razorpay verify must confirm capture.** After the HMAC check, fetch the payment and assert `status === "captured"`, `payment.order_id === orderId`, and captured amount matches order amount before fulfilling.
- **Fulfillment is Admin SDK only.** `fulfillVerifiedOrder()` writes `orders` + `licenses` and `purchases: increment(1)`; idempotent on `gateway`+`orderId`; license key `XXXX-XXXX-XXXX-XXXX` generated server-side. Browsers cannot write `orders`/`licenses` (Firestore rules deny client read and write).
- Gateway env var lists: razorpay = `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `NEXT_PUBLIC_RAZORPAY_KEY_ID`; stripe = `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. Set all in Vercel before switching.
- GitHub sync: `GET /api/github` proxies GitHub (10-min revalidate, `?force=1`); Vercel Cron `0 2 * * *` hits `POST /api/github/sync-all` (`CRON_SECRET` **required** — fail closed with 503 if unset), re-fetching products with `repoUrl` via `mergeSyncedWithManual` (manual overrides preserved).

## Caching (client-side)

| Data | TTL | Notes |
|---|---|---|
| Products | 5 min | cleared on write in `products.ts` |
| Orders | 5 min | read-only |
| Site settings / CMS | 5 min | cleared on write |
| Payment settings | 30 s | controls gateway + multi-currency |
| FX rates | 1 h | `localStorage.nx_rates` |
| Geo/IP | session | `sessionStorage.nx_geo` |
| GET /api/github | 10 min | Next data cache; `?force=1` bypasses |

## Gotchas

- `getProducts()` returns hardcoded `MOCK_PRODUCTS` when Firestore is empty or unreachable — don't mistake mock data for real data. `getHomepageContent()`/`getSiteSettings()` deep-merge over hardcoded defaults the same way.
- Firestore rules deploy is manual: editing `firestore.rules` does nothing until deployed. `isAdmin()` hardcodes one email — keep it in sync with `NEXT_PUBLIC_ADMIN_EMAILS`. `orders`/`licenses` are admin-read-only (`allow read: if isAdmin()`); customer-facing lookup goes through authenticated server routes.
- Keep only `package-lock.json` — a stray `pnpm-lock.yaml` makes Vercel switch package managers and break the deploy.
- Next bundles its own postcss; `package.json` `overrides` pins it past a CVE — if Next's pin bumps, re-run `npm audit` and reconcile.
- Git push uses HTTPS + gh credential helper (`gh auth setup-git`); if push hangs, re-run it. Raw Vercel deployment URLs 302 to SSO — probe `https://nexusprods.vercel.app` instead. `vercel env add` overwrites existing values.
- AI instruction files (`CLAUDE.md`, `GEMINI.md`, `skills/`, `graphify-out/`) are gitignored — don't commit them.

## Security gotchas

- **Server-side price authority is non-negotiable.** Any new payment route must recompute the chargeable amount from `products/{id}.price` and reject mismatches. Do not accept `amount` from the client body.
- **`verifyIdToken` refetches JWKS on a `kid` miss** — don't cache signing keys longer than 1 h without a refetch-on-miss path; add `AbortSignal.timeout` to the JWKS fetch. Always check `claims.emailVerified === true` on server-side admin gates.
- **`gateway-health` fails closed:** empty `NEXT_PUBLIC_ADMIN_EMAILS` → 503; unverified email → 403. Use a server-side allowlist env var, not `NEXT_PUBLIC_*`.
- **`/api/github/sync-all` requires `CRON_SECRET`** — unset = 503. Don't make state-mutating cron endpoints publicly reachable.
- **Firestore rules are the authority for writes** — Admin SDK bypasses them, but client reads of `orders`/`licenses` are denied. Don't add client reads of these collections; scope lookups via server routes.
- **`contacts` requires auth + field limits** — `allow create` is gated on `request.auth != null` with string type/size checks. Move contact submission to a validated server route for rate limiting.

## Checkout fallback convention

`processRazorpay`/`processStripe` return `"ok" | "error" | "fallback"`; `handleCheckout` retries the other gateway once. Don't let the two processors call each other.
