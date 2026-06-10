import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SETTINGS_DOC_ID = "site";
const CACHE_TTL = 5 * 60 * 1000;
let cachedSettings: SiteSettings | null = null;
let cacheTime = 0;

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface StepItem {
  title: string;
  description: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface StatCard {
  value: string;
  label: string;
}

export interface PrincipleItem {
  title: string;
  description: string;
}

export interface SiteSettings {
  brandName: string;
  siteUrl: string;

  navLinks: NavLink[];
  navCta: { label: string; href: string };

  footerColumns: FooterColumn[];
  footerCopyright: string;
  footerStatusText: string;
  footerVersionBadge: string;

  trustStrip: string[];

  howItWorks: {
    heading: string;
    subheading: string;
    steps: StepItem[];
  };

  bentoGrid: {
    heading: string;
    subheading: string;
    description: string;
    features: FeatureItem[];
  };

  productSectionHeadings: {
    heading: string;
    subheading: string;
    description: string;
  };

  finalCta: {
    heading: string;
    subheading: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
  };

  sectionHeadings: {
    testimonials: { heading: string; subheading: string };
    faq: { heading: string; subheading: string };
  };

  heroDecorStats: StatCard[];

  productsPage: {
    heading: string;
    subheading: string;
    description: string;
  };

  productDetail: {
    acquireLabel: string;
    livePreviewLabel: string;
    noDemoLabel: string;
    documentationLabel: string;
    checkoutLabel: string;
    merchantName: string;
  };

  dashboard: {
    vaultHeading: string;
    vaultDescription: string;
    libraryHeading: string;
    downloadsReady: string;
    signOutLabel: string;
    sslBadge: string;
    emptyHeading: string;
    emptyDescription: string;
  };

  ordersPage: {
    heading: string;
    subheading: string;
    description: string;
  };

  aboutPage: {
    heroHeading: string;
    heroSubheading: string;
    statCards: StatCard[];
    manifestoQuote: string;
    manifestoAttribution: string;
    principlesSectionHeading: string;
    principlesSectionSubheading: string;
    principles: PrincipleItem[];
    collectiveSectionLabel: string;
    collectiveHeading: string;
    collectiveBody: string[];
    teamLabel: string;
    teamDate: string;
  };

  contactPage: {
    heading: string;
    subheading: string;
    description: string;
    detailsHeading: string;
    detailsSubheading: string;
    responseTime: string;
    formSuccessHeading: string;
    formSuccessMessage: string;
    formSendAnother: string;
    formLabels: { name: string; email: string; subject: string; message: string };
  };

  notFound: {
    code: string;
    heading: string;
    description: string;
    backButton: string;
    browseButton: string;
  };

  cookieBanner: {
    message: string;
    acceptLabel: string;
    learnMoreLabel: string;
  };

  legalPages: {
    terms: string;
    privacy: string;
    cookies: string;
  };
}

export const defaultSiteSettings: SiteSettings = {
  brandName: "Nexus",
  siteUrl: "https://nexus-software.com",

  navLinks: [
    { label: "Products", href: "/products" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Track Order", href: "/orders" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  navCta: { label: "Shop Now", href: "/products" },

  footerColumns: [
    {
      heading: "Product",
      links: [
        { label: "Browse Software", href: "/products" },
        { label: "My Dashboard", href: "/dashboard" },
        { label: "Track Order", href: "/orders" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
      ],
    },
  ],
  footerCopyright: "\u00A9 {year} Nexus. All rights reserved.",
  footerStatusText: "All systems operational",
  footerVersionBadge: "v2.0",

  trustStrip: [
    "License-based access",
    "Built entirely in-house",
    "Instant delivery",
    "No resellers ever",
    "Razorpay secured",
  ],

  howItWorks: {
    heading: "Simple by design",
    subheading: "How it works.",
    steps: [
      {
        title: "Browse the catalogue",
        description: "Explore our exclusive software suite, built and sold only by Nexus.",
      },
      {
        title: "Secure checkout",
        description: "One-click payment via Razorpay. Safe, instant, and hassle-free.",
      },
      {
        title: "Get your license",
        description: "Receive your license key instantly. Access it anytime from your dashboard.",
      },
    ],
  },

  bentoGrid: {
    heading: "What we build",
    subheading: "Engineered in-house. Sold exclusively.",
    description: "Every line of code, every design decision \u2014 crafted by Nexus and sold only here.",
    features: [
      { title: "Developer Tooling", description: "Purpose-built instruments for speed, precision, and deep focus." },
      { title: "Design Systems", description: "Pixel-perfect interfaces for the modern web." },
      { title: "Security First", description: "End-to-end encrypted. Zero compromise." },
      { title: "Silicon Native & Zero Latency", description: "Optimized for modern hardware. Instant sync, everywhere." },
    ],
  },

  productSectionHeadings: {
    heading: "The Catalogue",
    subheading: "Our software suite.",
    description: "Curated products for the modern builder.",
  },

  finalCta: {
    heading: "Ready to start?",
    subheading: "Build something remarkable.",
    description: "Join thousands of creators using Nexus to ship faster, build smarter, and stand out.",
    primaryButton: "Browse Products",
    secondaryButton: "Contact Us",
  },

  sectionHeadings: {
    testimonials: { heading: "Social proof", subheading: "Trusted by builders." },
    faq: { heading: "Got questions?", subheading: "Common answers." },
  },

  heroDecorStats: [
    { value: "10k+", label: "Active users" },
    { value: "99.9%", label: "Uptime" },
    { value: "50+", label: "Countries" },
    { value: "< 1s", label: "Delivery" },
  ],

  productsPage: {
    heading: "The Catalogue",
    subheading: "Premium software, built in-house.",
    description: "Every product is designed, engineered, and sold exclusively here. License-based access. Instant delivery.",
  },

  productDetail: {
    acquireLabel: "Acquire License",
    livePreviewLabel: "Live Preview",
    noDemoLabel: "No Demo Available",
    documentationLabel: "View Documentation",
    checkoutLabel: "Checkout",
    merchantName: "Nexus SaaS",
  },

  dashboard: {
    vaultHeading: "Your Vault",
    vaultDescription: "Sign in with your purchase email to access your provisioned software assets.",
    libraryHeading: "My Library",
    downloadsReady: "Downloads ready",
    signOutLabel: "Sign Out",
    sslBadge: "SSL Secured \u2022 End-to-End Encrypted",
    emptyHeading: "Your vault is empty",
    emptyDescription: "Your collection starts here \u2014 every purchase adds to your vault, tied to {email}.",
  },

  ordersPage: {
    heading: "Order history",
    subheading: "Track your orders.",
    description: "Enter the email address used during checkout to view your purchase history.",
  },

  aboutPage: {
    heroHeading: "We build software differently.",
    heroSubheading: "",
    statCards: [
      { value: "2023", label: "Founded" },
      { value: "10+", label: "Products" },
      { value: "50+", label: "Countries" },
      { value: "99.9%", label: "Uptime" },
    ],
    manifestoQuote: "\u201CHigh-performance software doesn\u2019t have to be visually abrasive. Speed and beauty are the same thing \u2014 and we exist to prove it.\u201D",
    manifestoAttribution: "Nexus Core Team",
    principlesSectionHeading: "What drives us",
    principlesSectionSubheading: "Core principles.",
    principles: [
      { title: "Precision", description: "Every pixel, every API, every interaction is deliberate. We build tools that do exactly what they say \u2014 nothing more." },
      { title: "Speed", description: "Eliminating latency between thought and execution \u2014 at the code level, the UI level, and the business level." },
      { title: "Ownership", description: "We own every line of code we ship. No outsourced quality, no third-party dependencies we don\u2019t understand." },
    ],
    collectiveSectionLabel: "The Collective",
    collectiveHeading: "Built different,\nby design.",
    collectiveBody: [
      "Nexus was founded on a simple realization: high-performance software doesn\u2019t have to be visually abrasive.",
      "We operate as a high-trust collective, prioritizing deep work and architectural integrity over generic growth. Every tool we ship is something we use daily.",
      "We push the boundaries of what\u2019s possible on the web \u2014 crafting a digital suite that scales with your ambition.",
    ],
    teamLabel: "Nexus Core Team",
    teamDate: "Founded 2023",
  },

  contactPage: {
    heading: "Get in touch",
    subheading: "Let\u2019s Connect.",
    description: "Have a question or need support? We respond to every message within 24 hours.",
    detailsHeading: "Contact details",
    detailsSubheading: "Our team is distributed globally and available across timezones.",
    responseTime: "Typically replies within 2 hours",
    formSuccessHeading: "Message sent!",
    formSuccessMessage: "We\u2019ll get back to you within 24 hours.",
    formSendAnother: "Send another",
    formLabels: { name: "Name", email: "Email", subject: "Subject", message: "Message" },
  },

  notFound: {
    code: "Error 404",
    heading: "Page not found.",
    description: "The page you\u2019re looking for doesn\u2019t exist or has been moved.",
    backButton: "Back to Home",
    browseButton: "Browse Products",
  },

  cookieBanner: {
    message: "We use cookies to improve your experience.",
    acceptLabel: "Accept",
    learnMoreLabel: "Learn more",
  },

  legalPages: {
    terms: "",
    privacy: "",
    cookies: "",
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cachedSettings && Date.now() - cacheTime < CACHE_TTL) return cachedSettings;
  try {
    const snap = await getDoc(doc(db, "settings", SETTINGS_DOC_ID));
    if (snap.exists()) {
      cachedSettings = { ...defaultSiteSettings, ...snap.data() } as SiteSettings;
    } else {
      cachedSettings = defaultSiteSettings;
    }
  } catch {
    cachedSettings = defaultSiteSettings;
  }
  cacheTime = Date.now();
  return cachedSettings;
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<boolean> {
  try {
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), data, { merge: true });
    cachedSettings = null;
    return true;
  } catch {
    throw new Error("Failed to update site settings");
  }
}
