# Nexus — Project Documentation

Nexus is a premium software e-commerce platform built with Next.js 16, Firebase, and dual payment gateway support (Razorpay + Stripe). Users browse and purchase software licenses; admins manage products, orders, and site content through a secure admin portal.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Firebase Setup](#firebase-setup)
5. [Data Models](#data-models)
6. [Pages & Routes](#pages--routes)
7. [Components](#components)
8. [Library Functions](#library-functions)
9. [API Routes](#api-routes)
10. [Payment Flows](#payment-flows)
11. [Multi-Currency System](#multi-currency-system)
12. [Admin Portal](#admin-portal)
13. [Authentication](#authentication)
14. [Caching Strategy](#caching-strategy)
15. [Development Commands](#development-commands)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Payments | Razorpay, Stripe |
| Styling | Tailwind CSS v4 + Framer Motion |
| Theme | next-themes (dark/light mode) |
| Icons | Phosphor Icons |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (providers, navbar, footer)
│   ├── globals.css               # Global styles & design tokens
│   ├── about/page.tsx            # About page
│   ├── contact/page.tsx          # Contact page
│   ├── dashboard/page.tsx        # Customer license vault
│   ├── orders/page.tsx           # Order history + Stripe return handler
│   ├── privacy/page.tsx          # Privacy policy
│   ├── terms/page.tsx            # Terms of service
│   ├── cookies/page.tsx          # Cookie policy
│   ├── products/
│   │   ├── page.tsx              # Product catalog
│   │   └── [id]/page.tsx         # Product detail + checkout
│   ├── admin/
│   │   ├── layout.tsx            # Admin layout (auth guard + sidebar)
│   │   ├── page.tsx              # Admin index (redirects to dashboard)
│   │   ├── login/page.tsx        # Admin login
│   │   ├── dashboard/page.tsx    # Stats overview
│   │   ├── products/page.tsx     # Product management
│   │   ├── orders/page.tsx       # Order management
│   │   ├── content/page.tsx      # CMS editor
│   │   └── settings/page.tsx     # Payment gateway + currency settings
│   └── api/
│       ├── razorpay/route.ts     # Razorpay order creation
│       ├── stripe/route.ts       # Stripe checkout session creation
│       └── stripe/verify/route.ts# Stripe payment verification
├── components/
│   ├── CurrencyProvider.tsx      # Multi-currency context + hook
│   ├── ThemeProvider.tsx         # Dark/light theme wrapper
│   ├── ThemeToggle.tsx           # Theme switch button
│   ├── Navbar.tsx                # Public navigation bar
│   ├── NavbarWrapper.tsx         # Hides navbar on admin routes
│   ├── Footer.tsx                # Public footer
│   ├── FooterWrapper.tsx         # Hides footer on admin routes
│   ├── ContentWrapper.tsx        # Page content layout wrapper
│   └── CookieBanner.tsx          # Cookie consent banner
└── lib/
    ├── firebase.ts               # Firebase client initialization
    ├── products.ts               # Product CRUD + Firestore cache
    ├── orders.ts                 # Order CRUD + Firestore cache
    ├── cms.ts                    # Homepage content management
    ├── licenses.ts               # License generation + lookup
    ├── currency.ts               # IP detection + exchange rates
    └── paymentSettings.ts        # Payment gateway configuration
```

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Firebase (all client-safe, used in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Razorpay
RAZORPAY_KEY_ID=              # Server-only (order creation)
RAZORPAY_KEY_SECRET=          # Server-only (order creation)
NEXT_PUBLIC_RAZORPAY_KEY_ID=  # Public (opens checkout modal)

# Stripe
STRIPE_SECRET_KEY=            # Server-only (session creation + verification)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Reserved for future Stripe Elements
```

> **Never commit `.env.local` to git.** It is already in `.gitignore`.

---

## Firebase Setup

### Initial Configuration

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** (start in test mode or configure rules)
3. Enable **Authentication** → Email/Password provider
4. Enable **Authentication** → Google provider (for customer dashboard)
5. Copy the web app config into `.env.local`

### Firestore Security Rules (recommended)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for products and content
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /content/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Orders and licenses: write on payment, read by email
    match /orders/{id} {
      allow create: if true;
      allow read: if request.auth != null || resource.data.customerInfo.email == request.auth.token.email;
      allow update, delete: if request.auth != null;
    }
    match /licenses/{id} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if request.auth != null;
    }
    // Settings: admin only
    match /settings/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Creating the Admin User

The admin portal uses email/password auth. Create the admin account manually:

1. Firebase Console → **Authentication** → **Users** → **Add user**
2. Enter your admin email and password
3. Use those credentials at `/admin/login`

---

## Data Models

### Product

Stored in Firestore collection: `products`

```typescript
interface Product {
  id: string;
  name: string;
  description: string;          // Short description (shown in cards)
  longDescription?: string;     // Full description (shown on detail page)
  price: number;                // Base price in USD
  imageUrl: string;             // Direct image URL
  features: string[];           // Bullet point feature list
  category: string;             // e.g. "Developer Tool", "Mobile App"
  version?: string;             // e.g. "1.0.0"
  demoUrl?: string;             // Live demo link
  downloadUrl?: string;         // File download link (post-purchase)
  documentationUrl?: string;    // Docs link
  order?: number;               // Display sort order
  purchases: number;            // Total purchase count (auto-incremented)
  createdAt: string;            // ISO 8601 timestamp
}
```

### Order

Stored in Firestore collection: `orders`

```typescript
interface Order {
  id?: string;
  productId: string;
  productName: string;
  amount: number;               // Actual charged amount (in display currency)
  currency: string;             // ISO 4217 code (e.g. "INR", "USD", "EUR")
  status: "pending" | "paid" | "failed";
  paymentId?: string;           // Razorpay payment_id or Stripe payment intent ID
  gateway?: "razorpay" | "stripe";
  customerInfo: {
    name?: string;
    email?: string;
    contact?: string;           // Phone number
  };
  createdAt: Timestamp;         // Firestore server timestamp
}
```

### License

Stored in Firestore collection: `licenses`

```typescript
interface License {
  id?: string;
  licenseKey: string;           // Format: "XXXX-XXXX-XXXX-XXXX" (random alphanumeric)
  productId: string;
  productName: string;
  customerEmail: string;
  orderId: string;              // Reference to the order that created this license
  createdAt: Timestamp;
  status: "active" | "revoked";
}
```

### Homepage Content (CMS)

Stored in Firestore document: `content/homepage_content`

```typescript
interface HomepageContent {
  hero: {
    badge: string;              // Small label above heading (e.g. "Next Generation Software")
    headingLine1: string;
    headingLine2: string;
    subheading: string;
  };
  stats: Array<{
    label: string;              // e.g. "Active Users"
    value: string;              // e.g. "10,000+"
  }>;
  testimonials: Array<{
    quote: string;
    author: string;
    role: string;
  }>;
  faq: Array<{
    q: string;
    a: string;
  }>;
  about: {
    title: string;
    description: string;
    imageUrl?: string;
  };
  footer: {
    description: string;
    socialLinks: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
  };
  contact: {
    emails: string[];
    phone?: string;
    hours?: string;
    address?: {
      line1: string;
      line2?: string;
    };
  };
  categories: string[];         // Product category list for filtering
}
```

### Payment Settings

Stored in Firestore document: `settings/payment`

```typescript
interface PaymentSettings {
  gateway: "razorpay" | "stripe";
  multiCurrencyEnabled: boolean;
  updatedAt: string;            // ISO 8601 timestamp
}
```

---

## Pages & Routes

### Public Pages

#### `/` — Landing Page
The homepage loads content from Firestore (with `defaultContent` as the initial render to prevent flash). Sections:
- **Hero** — Animated two-column layout. Left: headline + CTA. Right: browser mockup with floating metric cards.
- **Stats** — 4-column stat grid from CMS.
- **Products** — First 3 products from the catalog with pricing.
- **Testimonials** — Customer quote cards from CMS.
- **FAQ** — Accordion-style FAQ from CMS.
- **CTA** — Full-width call-to-action section.

#### `/products` — Product Catalog
- Loads all products from Firestore.
- Category filter pills (dynamically generated from product data).
- Search input filters by product name in real-time.
- Each product card shows image, category badge, price (in user's local currency), name, description, and a "View & Purchase" CTA.

#### `/products/[id]` — Product Detail & Checkout
- Loads a single product by ID.
- Shows full description, feature checklist, demo/docs links, pricing.
- Detects active payment gateway from Firestore (`settings/payment`).
- **Razorpay**: Opens inline modal. Fills customer form (name, email, phone).
- **Stripe**: Redirects to Stripe-hosted checkout page.
- On successful payment: saves order → increments purchase count → generates license → shows license key.

#### `/dashboard` — Customer License Vault
- Requires Google Sign-In.
- After login, fetches all licenses where `customerEmail == user.email`.
- Shows license cards with: product name, license key (copyable), download/docs/demo buttons.

#### `/orders` — Order History
- Email-based search (no login required for basic lookup).
- On load, checks for `?stripe_session_id=` in the URL — handles Stripe payment return.
- Queries orders by `customerInfo.email`.
- Displays order cards with status badge (paid/pending/failed), payment ID, amount, currency.

#### `/about`, `/contact`, `/privacy`, `/terms`, `/cookies`
Static or CMS-driven informational pages.

---

### Admin Pages (Protected)

All admin routes require Firebase email/password authentication. Unauthenticated users are redirected to `/admin/login`.

| Route | Purpose |
|---|---|
| `/admin/login` | Email/password login form |
| `/admin/dashboard` | Stats overview (revenue, orders, products, conversions) + recent orders + quick actions |
| `/admin/products` | Product table with add/edit/delete. Modal form with all product fields. |
| `/admin/orders` | Searchable orders table (by product, email, or payment ID). |
| `/admin/content` | Tab-based CMS editor for all homepage sections. |
| `/admin/settings` | Payment gateway switcher, multi-currency toggle, database seed tool. |

---

## Components

### `CurrencyProvider`
Context provider that wraps the entire app. Provides the `useCurrency()` hook.

```typescript
// Usage
const { currency, rate, convert, format, loading, multiCurrencyEnabled } = useCurrency();

// format: converts USD price to local currency string
format(9.99)  // → "₹848" for Indian users, "$9.99" for US users

// convert: returns numeric converted amount (for sending to payment API)
convert(9.99)  // → 848 (for INR)
```

When `multiCurrencyEnabled` is `false` in Firestore, the hook returns USD for all users.

### `ThemeProvider`
Wraps `next-themes`. Supports `"system"`, `"light"`, `"dark"` values. Applied at the `<html>` element level with `suppressHydrationWarning`.

### `NavbarWrapper` / `FooterWrapper`
Check the current pathname. If the route starts with `/admin`, the navbar and footer are hidden so the admin layout is shown instead.

### `Navbar`
Fixed-position top navigation bar. Features:
- Logo (links to `/`)
- Nav links: Products, Dashboard, Track Order, About, Contact
- Theme toggle
- "Shop Now" CTA button
- Mobile hamburger menu (slides in from top)
- Glass-morphism style that becomes more opaque on scroll

### `Footer`
Multi-column footer. Columns: branding/description, Products, Company, Legal. Social links (Twitter/GitHub/LinkedIn) pulled from CMS `footer.socialLinks`.

---

## Library Functions

### `src/lib/products.ts`

```typescript
getProducts(): Promise<Product[]>
// Returns all products sorted by purchases DESC, then createdAt DESC.
// 5-minute in-memory cache. Falls back to MOCK_PRODUCTS if Firestore is empty.

getProductById(id: string): Promise<Product | null>
// Returns a single product. Checks cache first.

addProduct(product: Omit<Product, 'id' | 'purchases' | 'createdAt'>): Promise<void>
// Adds a new product to Firestore. Invalidates cache.

updateProduct(id: string, updates: Partial<Product>): Promise<void>
// Merge-updates a product. Invalidates cache.

deleteProduct(id: string): Promise<void>
// Removes a product. Invalidates cache.

seedProducts(): Promise<void>
// Populates Firestore with 3 demo products. Used from admin settings.
```

### `src/lib/orders.ts`

```typescript
addOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<string>
// Creates a new order. Returns the Firestore document ID.

getOrders(): Promise<Order[]>
// Returns all orders sorted by createdAt DESC. 5-minute cache.
```

### `src/lib/cms.ts`

```typescript
getHomepageContent(): Promise<HomepageContent>
// Fetches content/homepage_content doc. Returns defaultContent if not found.
// 5-minute cache.

updateHomepageContent(data: Partial<HomepageContent>): Promise<void>
// Merge-updates the CMS document. Invalidates cache.

defaultContent: HomepageContent
// Hardcoded fallback — used as initial state to avoid hero flash on load.
```

### `src/lib/licenses.ts`

```typescript
generateLicense(data: {
  productId: string;
  productName: string;
  customerEmail: string;
  orderId: string;
}): Promise<{ id: string; licenseKey: string }>
// Generates a random "XXXX-XXXX-XXXX-XXXX" license key and stores it in Firestore.

getLicensesByEmail(email: string): Promise<License[]>
// Returns all licenses for a given customer email, newest first.
```

### `src/lib/currency.ts`

```typescript
detectCurrency(): Promise<string>
// Detects user's currency from IP via ipapi.co.
// Falls back to timezone inference if API unavailable.
// Caches result in sessionStorage with IP check (VPN-aware: re-detects on IP change).
// Returns ISO 4217 currency code (e.g. "INR", "EUR").

fetchRates(): Promise<Record<string, number>>
// Fetches live USD-based exchange rates from open.er-api.com.
// Caches in localStorage for 1 hour.
// Falls back to hardcoded rates if API fails.

formatPrice(amount: number, currency: CurrencyInfo): string
// Formats a number with the correct symbol and decimal places.
// Examples: formatPrice(848, INR) → "₹848", formatPrice(9.99, USD) → "$9.99"
```

### `src/lib/paymentSettings.ts`

```typescript
getPaymentSettings(): Promise<PaymentSettings>
// Fetches settings/payment from Firestore. 30-second cache.
// Default: { gateway: "razorpay", multiCurrencyEnabled: true }

setPaymentGateway(gateway: "razorpay" | "stripe"): Promise<void>
// Updates the active payment gateway. Updates cache immediately.

setMultiCurrencyEnabled(enabled: boolean): Promise<void>
// Enables or disables multi-currency pricing site-wide.

invalidatePaymentCache(): void
// Clears the in-memory payment settings cache.
```

---

## API Routes

### `POST /api/razorpay`

Creates a Razorpay order server-side.

**Request:**
```json
{
  "amount": 848,
  "currency": "INR"
}
```

**Response:**
```json
{
  "id": "order_XXXXXXXXXXXXXXXX",
  "currency": "INR",
  "amount": 84800
}
```
Amount is in the smallest currency unit (paise for INR, cents for USD).

**Environment variables used:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

---

### `POST /api/stripe`

Creates a Stripe Checkout Session and returns the redirect URL.

**Request:**
```json
{
  "amount": 9.99,
  "currency": "USD",
  "productId": "abc123",
  "productName": "DevFlow Pro",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerContact": "+1234567890"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_test_..."
}
```

After payment, Stripe redirects to `/orders?stripe_session_id={sessionId}`.

**Environment variables used:** `STRIPE_SECRET_KEY`

---

### `GET /api/stripe/verify?session_id={sessionId}`

Verifies a completed Stripe payment and returns order details.

**Response (success):**
```json
{
  "paymentId": "pi_...",
  "amount": 9.99,
  "currency": "usd",
  "metadata": {
    "productId": "abc123",
    "productName": "DevFlow Pro",
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerContact": "+1234567890"
  },
  "customerEmail": "jane@example.com"
}
```

**Response (unpaid):**
```json
{ "error": "Payment not completed" }
```

**Environment variables used:** `STRIPE_SECRET_KEY`

---

## Payment Flows

### Razorpay Flow

```
User fills form (name, email, phone)
        ↓
POST /api/razorpay { amount, currency }
        ↓
Server creates Razorpay order → returns { id, amount, currency }
        ↓
Client loads Razorpay script dynamically
        ↓
Razorpay checkout modal opens (prefilled with customer info)
        ↓
User pays (UPI / card / net banking / wallet)
        ↓
Razorpay calls onSuccess callback with { razorpay_payment_id, ... }
        ↓
Client saves order to Firestore (status: "paid")
Client increments product.purchases by 1
Client calls generateLicense() → stores license in Firestore
        ↓
Success alert shows license key
User visits /dashboard or /orders to see their purchase
```

### Stripe Flow

```
User fills form (name, email, phone)
        ↓
POST /api/stripe { amount, currency, productId, customerInfo... }
        ↓
Server creates Stripe Checkout Session → returns { url, sessionId }
        ↓
Client redirects to Stripe-hosted checkout page
        ↓
User pays on Stripe
        ↓
Stripe redirects to /orders?stripe_session_id={sessionId}
        ↓
Orders page calls GET /api/stripe/verify?session_id={sessionId}
        ↓
Server verifies payment_status === "paid"
Returns { paymentId, amount, currency, metadata }
        ↓
Client saves order to Firestore (status: "paid")
Client calls generateLicense() → stores license in Firestore
        ↓
Success modal shows license key with copy button
```

### Switching Payment Gateways

Admins switch gateways from `/admin/settings`. The active gateway is stored in `settings/payment` in Firestore and fetched by the product detail page on load (30-second cache). No code deployment is required to switch.

---

## Multi-Currency System

The multi-currency system automatically detects a user's location and shows prices in their local currency.

### How It Works

1. **Feature flag check** — `CurrencyProvider` reads `settings/payment.multiCurrencyEnabled` from Firestore on mount. If `false`, all users see USD and no geo-detection occurs.

2. **IP detection** — `detectCurrency()` calls `ipapi.co/json/` to get the user's country code, then maps it to a currency using `COUNTRY_CURRENCY`.

3. **VPN detection** — The detected IP is stored in `sessionStorage`. On every page load, the current IP is compared to the cached IP. If they differ (VPN switched), currency is re-detected.

4. **Timezone fallback** — If `ipapi.co` is unreachable, the user's timezone is used to infer a likely currency.

5. **Exchange rates** — Live rates are fetched from `open.er-api.com/v6/latest/USD`. Cached in `localStorage` for 1 hour. A hardcoded rate table serves as the final fallback.

6. **Formatting** — `format(usdPrice)` converts the USD price to the local currency and formats it with the correct symbol and decimal places (e.g., JPY has 0 decimals, USD has 2).

### Supported Currencies (50+)

USD, INR, EUR, GBP, JPY, AUD, CAD, SGD, AED, BRL, MXN, CHF, SEK, NOK, DKK, PLN, CNY, KRW, THB, MYR, IDR, PHP, VND, ZAR, NGN, KES, PKR, BDT, LKR, NPR, SAR, QAR, KWD, BHD, EGP, MAD, ARS, CLP, COP, PEN, NZD, HKD, TWD, TRY, RUB, UAH, ILS

### Admin Control

Go to `/admin/settings` → **Multi-Currency Pricing** toggle. Changes take effect for new page loads (30-second cache on payment settings).

---

## Admin Portal

### Accessing the Admin

1. Navigate to `/admin/login`
2. Sign in with the email/password you created in Firebase Authentication
3. You will be redirected to `/admin/dashboard`

### Dashboard

Displays:
- **Total Revenue** — Sum of all paid order amounts (in original currency)
- **Total Orders** — Count of all orders
- **Active Products** — Count of products in Firestore
- **Paid Orders** — Count of orders with `status: "paid"`
- **Recent Orders** — Last 5 orders with product, customer, amount, status
- **Quick Actions** — Links to Products, Content, Orders

### Product Management

- **Add a product** — Click "+ New Product", fill in all fields, click "Add Product"
- **Edit a product** — Click the pencil icon on any row
- **Delete a product** — Click the trash icon (with confirmation prompt)

**Product fields:**
- Name, Price (USD), Category, Cover Image URL, Version, Live Demo URL, Download URL, Documentation URL, Description, Features (one per line)

**Image URL formats that work:**
- Firebase Storage download URLs
- `https://lh3.googleusercontent.com/d/{FILE_ID}` (Google Drive — file must be publicly shared)
- `https://drive.google.com/uc?export=view&id={FILE_ID}` (Google Drive alternative)
- Any direct `.jpg`, `.png`, `.webp`, or `.gif` URL

### Content (CMS)

Manage all homepage content through 8 tabs:

| Tab | What it controls |
|---|---|
| Hero | Badge text, heading lines, subheading |
| Stats | Label/value pairs shown in the stats row |
| About | About page title, description, image |
| Testimonials | Customer quotes shown on landing page |
| FAQ | Frequently asked questions accordion |
| Footer | Site description, social media links |
| Categories | List of product categories for filtering |
| Contact | Email addresses, phone, hours, address |

### Orders

- Search by product name, customer email, or payment ID
- View order status (paid / pending / failed)
- See payment gateway used (Razorpay or Stripe)

### Settings

**Payment Gateway** — Switch between Razorpay and Stripe. Takes effect immediately for new checkouts.

| Gateway | Best for | Required env vars |
|---|---|---|
| Razorpay | India & South Asia (UPI, cards, net banking) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| Stripe | Global (cards, Apple Pay, Google Pay) | `STRIPE_SECRET_KEY` |

**Multi-Currency Pricing** — Toggle whether users see prices in their local currency. When disabled, all users see USD.

**Database Tools** — Seeds Firestore with default homepage content and 3 sample products. Overwrites existing content.

---

## Authentication

### Admin Authentication (Email/Password)

- Used only for the admin portal (`/admin/*`)
- Firebase Auth email/password provider
- The `onAuthStateChanged()` listener in `src/app/admin/layout.tsx` redirects unauthenticated users to `/admin/login`
- Sign out available in the admin sidebar footer

### Customer Authentication (Google OAuth)

- Used only for the customer dashboard (`/dashboard`)
- Firebase Auth Google provider (`googleProvider` from `src/lib/firebase.ts`)
- After sign-in, licenses are fetched by `user.email`
- Optional — customers can also view orders at `/orders` by entering their email (no login required)

---

## Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|---|---|---|---|
| Products list | In-memory (module-level) | 5 minutes | On any write (add/update/delete) |
| Single product | In-memory (included in list) | 5 minutes | On update/delete |
| Orders list | In-memory (module-level) | 5 minutes | On new order |
| Homepage CMS | In-memory (module-level) | 5 minutes | On content update |
| Payment settings | In-memory (module-level) | 30 seconds | On gateway/currency change |
| Exchange rates | `localStorage` | 1 hour | Automatic TTL expiry |
| Geolocation / IP | `sessionStorage` | Session (+ IP check) | On IP change (VPN detection) |

---

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build (runs TypeScript checks)
npm run start    # Start production server (requires build first)
npm run lint     # Run ESLint
```

No test suite is configured.

### Adding a New Product Category

1. Go to `/admin/content` → **Categories** tab
2. Add the category name
3. Save — it will appear in the product filter pills on `/products`
4. When adding products, the new category will be available in the dropdown

### Deploying to Vercel

1. Push to the `main` branch on GitHub
2. Vercel auto-deploys on every push
3. Set all environment variables in Vercel → Project → Settings → Environment Variables
4. The build runs `npm run build` — if it fails, check the TypeScript output for errors
