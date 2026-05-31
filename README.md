# Nexus — Software E-Commerce Platform

> **A premium software marketplace with dual payment gateways, multi-currency support, and a full admin portal.** Built with Next.js 16, Firebase, Razorpay, and Stripe.

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwind-css)](https://tailwindcss.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?logo=razorpay)](https://razorpay.com)
[![Stripe](https://img.shields.io/badge/Stripe-008CDD?logo=stripe)](https://stripe.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer)](https://www.framer.com/motion/)

---

## Features

- **Product Catalog** — Browse software products with rich detail pages, screenshots, and feature breakdowns
- **Dual Payments** — Checkout via Razorpay (India) or Stripe (global) with automatic gateway selection
- **Multi-Currency** — Dynamic pricing in INR, USD, EUR, and more with live conversion
- **Customer Dashboard** — License vault with purchase history and download management
- **Admin Portal** — Manage products, orders, users, site content, and payment analytics
- **Authentication** — Firebase Auth with Google sign-in
- **Dark/Light Mode** — System-aware theming with next-themes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Payments | Razorpay + Stripe |
| Styling | Tailwind CSS v4, Framer Motion |
| Icons | Phosphor Icons |
| Hosting | Vercel |

## Getting Started

```bash
# Clone
git clone https://github.com/justaman045/Nexus.git
cd Nexus

# Install
npm install

# Set up environment
cp .env.example .env.local
# Fill in Firebase config, Razorpay keys, Stripe keys

# Run dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK config |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK key (JSON) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay credentials |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe credentials |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # Landing page
│   ├── products/           # Product catalog + detail pages
│   ├── dashboard/          # Customer license vault
│   ├── orders/             # Order history
│   ├── admin/              # Admin portal
│   └── api/
│       ├── razorpay/       # Razorpay order/verify/webhook
│       └── stripe/         # Stripe checkout/webhook
├── components/             # Reusable UI components
└── lib/                    # Firebase, utilities, helpers
```

For full documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md).
