# Nexus — Agent Guide

## Quick start

```bash
npm install           # install deps
# No .env.example — copy a known-good .env.local manually
# Needed: NEXT_PUBLIC_FIREBASE_* (6 vars), RAZORPAY_KEY_ID/SECRET,
#          NEXT_PUBLIC_RAZORPAY_KEY_ID, STRIPE_SECRET_KEY,
#          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npm run dev           # → http://localhost:3000
npm run build         # prod build (runs tsc automatically)
npm run lint          # ESLint 9 flat config
```

**No tests.** `npm test` will fail.

## Key facts

- **Single Next.js 16 app** (App Router), every page is `"use client"` — root `layout.tsx` is the only server component
- **Firebase client SDK only** — no `firebase-admin`, no Firebase rules file in repo. All DB writes happen client-side (Firestore security rules must allow this)
- **Payments**: Razorpay (inline modal) + Stripe (redirect Checkout Session). Gateway chosen client-side from `settings/payment` in Firestore
- **Import alias**: `@/*` → `./src/*`
- **Version pins**: Next.js `16.1.6`, React `19.2.3`, Stripe SDK `22.1.0` with `apiVersion: "2026-04-22.dahlia"`
- **Deprecated `shortid`** used in Razorpay route for receipts

## Cache TTLs (all client-side in-memory)

| Data | TTL | Notes |
|------|-----|-------|
| Products, orders, CMS | 5 min | Cleared on write |
| Payment settings | 30 sec | Controls gateway + multi-currency flag |
| Exchange rates | 1 h (localStorage) | Key `nx_rates` |
| Geo/IP | sessionStorage + IP check | Key `nx_geo` |

## Gotchas

- **Mock fallbacks** — `getProducts()` and `getHomepageContent()` return hardcoded data when Firestore is unreachable (app fully renders without backend)
- **Split domains** — `metadataBase` in `layout.tsx` = `https://nexusprods.vercel.app`, sitemap/robots uses `https://nexus-software.com`
- **Admin layout forces dark theme** via inline `style={{ background: "#05050f" }}`
- **No middleware** — admin auth is entirely client-side (`onAuthStateChanged` in admin layout)
- **`@stripe/stripe-js`** is installed but Stripe Elements are unused; only Checkout Session redirect flow
- **No route groups** exist despite DOCUMENTATION.md claiming `(checkout)` — directory is flat
- **`.env.example`** is committed but `.env*` (including `.env.local`) is gitignored — copy it to `.env.local` manually
- **Local AI config files** (`CLAUDE.md`, `GEMINI.md`, `skills/`) are gitignored per `.gitignore`
- **ESLint** uses flat config (`eslint.config.mjs`) with `eslint-config-next` core-web-vitals + TypeScript presets
