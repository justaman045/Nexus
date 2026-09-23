import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface HeroSection {
    badge: string;
    headingLine1: string;
    headingLine2: string;
    subheading: string;
}

export interface StatItem {
    label: string;
    value: string;
}

export interface TestimonialItem {
    quote: string;
    author: string;
    role: string;
}

export interface FAQItem {
    q: string;
    a: string;
}

export interface FooterSection {
    description: string;
    socialLinks: {
        twitter: string;
        github: string;
        linkedin: string;
    };
}

export interface AboutSection {
    title: string;
    description: string;
    imageUrl: string;
}

export interface ContactSection {
    emails: string[];
    phone: string;
    hours: string;
    address: {
        line1: string;
        line2: string;
    };
}

export interface HomepageContent {
    hero: HeroSection;
    stats: StatItem[];
    testimonials: TestimonialItem[];
    faq: FAQItem[];
    about: AboutSection;
    footer: FooterSection;
    contact: ContactSection;
    categories: string[];
}

const HOMEPAGE_DOC_ID = "homepage_content"; // Single doc for simplicity

export const defaultContent: HomepageContent = {
    hero: {
        badge: "✨ Next Generation Software",
        headingLine1: "Building the",
        headingLine2: "Digital Future",
        subheading: "Discover a suite of premium tools designed to elevate your workflow. From developer utilities to creative powerhouses."
    },
    categories: ["Developer Tool", "Design", "Productivity", "AI Tools"],
    about: {
        title: "About Nexus",
        description: "We are a team of passionate developers and designers building the next generation of software tools. Our mission is to empower creators with intuitive, powerful, and beautiful applications.",
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
    },
    contact: {
        emails: ["support@nexus.com", "sales@nexus.com"],
        phone: "+1 (555) 123-4567",
        hours: "Mon-Fri 9am-6pm EST",
        address: {
            line1: "123 Innovation Drive",
            line2: "Tech City, TC 90210"
        }
    },
    stats: [
        { label: "Active Users", value: "10k+" },
        { label: "Downloads", value: "50k+" },
        { label: "Countries", value: "100+" },
        { label: "Uptime", value: "99.9%" }
    ],
    testimonials: [
        {
            quote: "This platform has completely transformed how I manage my projects. The UI is stunning.",
            author: "Sarah J.",
            role: "Senior Engineer"
        },
        {
            quote: "I've never used a tool that feels this premium. Performance is top-notch too.",
            author: "Mike T.",
            role: "Product Designer"
        },
        {
            quote: "The customer support is incredible, and the software just works. Highly recommended.",
            author: "Emily R.",
            role: "Startup Founder"
        }
    ],
    faq: [
        { q: "Is there a free trial?", a: "Yes, all our products come with a 14-day free trial so you can experience the power of Nexus risk-free." },
        { q: "Can I use this for my team?", a: "Absolutely! We build with collaboration in mind. Check out our team plans on the pricing page." },
        { q: "What support do you offer?", a: "We provide 24/7 priority support for all premium users via email and chat." }
    ],
    footer: {
        description: "Empowering creators with premium software solutions.",
        socialLinks: {
            twitter: "#",
            github: "#",
            linkedin: "#"
        }
    }
};

let cachedContent: HomepageContent | null = null;
let lastContentFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getHomepageContent(): Promise<HomepageContent> {
    if (cachedContent && Date.now() - lastContentFetch < CACHE_TTL) {
        return cachedContent;
    }

    try {
        const docRef = doc(db, "content", HOMEPAGE_DOC_ID);
        const docSnap = await getDoc(docRef);

        // Deep-merge stored data over defaults so partial docs don't yield undefined sub-fields
        const merged = docSnap.exists()
            ? deepMergeStructure(defaultContent, docSnap.data() as Partial<HomepageContent>)
            : defaultContent;
        cachedContent = merged;
        lastContentFetch = Date.now();
        return merged;
    } catch (error) {
        console.error("Error fetching homepage content:", error);
        cachedContent = defaultContent;
        lastContentFetch = Date.now();
        return defaultContent;
    }
}

// Merges arrays/objects by key while favoring `partial` for primitive values.
function deepMergeStructure<T>(base: T, partial: unknown): T {
    if (partial === undefined || partial === null) return base;
    if (Array.isArray(base) || typeof base !== "object") return partial as T;
    if (Array.isArray(partial)) return partial as T;

    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(partial as Record<string, unknown>)) {
        out[key] = deepMergeStructure(
            (base as Record<string, unknown>)[key],
            (partial as Record<string, unknown>)[key]
        );
    }
    return out as T;
}

export async function updateHomepageContent(data: Partial<HomepageContent>) {
    try {
        const docRef = doc(db, "content", HOMEPAGE_DOC_ID);
        // Use setDoc with merge: true to create if not exists or update fields
        await setDoc(docRef, data, { merge: true });
        cachedContent = null;
        return true;
    } catch (error) {
        console.error("Error updating homepage content:", error);
        throw error;
    }
}
