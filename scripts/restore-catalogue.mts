// Restores the Nexus catalogue on the live project `company-24267`.
//
// Three things are repaired here:
//
//   1. The deleted Nexus product `NTfSwTwzdm4lAaYtpXCC` ("Finance Control").
//      Two customer licenses point at that document id, so recreating the
//      document at the exact same id re-links the licences — the customer
//      dashboard starts showing the product again.
//
//   2. The SaaSWaitlist catalogue is mirrored into Nexus `products` through the
//      real `POST /api/products` endpoint, exactly like the companion admin
//      dashboard does. The returned product id is written back onto the
//      project document as `nexusProductId`, which is the link the companion
//      uses for later updates/deletes.
//
//   3. The missing `settings/site` document is created from the app's own
//      `defaultSiteSettings`, so the site settings editor has something to
//      load and save.
//
// Run with:
//   npx tsx scripts/restore-catalogue.ts
//
// It is idempotent: re-running it updates the restored product in place and
// skips a project that is already mirrored.
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Loads one of the app's own modules.
 *
 * The app's modules are authored for the Next.js bundler and are transpiled
 * to CommonJS when this script runs, so they are reached through the interop
 * namespace's `default` export rather than through named ESM imports.
 */
async function loadAppModule<T>(specifier: string): Promise<T> {
  const loaded = (await import(specifier)) as { default?: T } & T;
  return (loaded.default ?? loaded) as T;
}

const { mapRepoToProduct, parseRepoInput } = await loadAppModule<
  typeof import("../src/lib/github")
>("../src/lib/github");
const { fetchGitHubRepoServer } = await loadAppModule<
  typeof import("../src/lib/server/githubFetch")
>("../src/lib/server/githubFetch");
const { defaultSiteSettings } = await loadAppModule<
  typeof import("../src/lib/siteSettings")
>("../src/lib/siteSettings");
// --- configuration ----------------------------------------------------------

const env = readFileSync(".env.local", "utf8");
const envValue = (key: string) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const PROJECT_ID = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "company-24267";
const API_KEY = envValue("NEXT_PUBLIC_FIREBASE_API_KEY") ?? "";
const ADMIN_EMAIL =
    envValue("NEXT_PUBLIC_ADMIN_EMAILS")?.split(",")[0]?.trim() ?? "developerlife69@gmail.com";
const NEXUS_API = envValue("NEXUS_API_URL") ?? "https://nexusprods.vercel.app/api/products";

/** The deleted product whose id the two customer licences still reference. */
const RESTORED_PRODUCT_ID = "NTfSwTwzdm4lAaYtpXCC";
/** The GitHub repository the deleted product was built from (renamed since). */
const RESTORED_REPO = "justaman045/WealthSync";
/** The catalogue price for the restored product (a one-time licence). */
const RESTORED_PRICE = 29;

const serviceAccount = JSON.parse(envValue("FIREBASE_SERVICE_ACCOUNT") ?? "{}");

const adminApp =
    getApps()[0] ??
    initializeApp(
        { credential: cert(serviceAccount), projectId: PROJECT_ID },
        "nexus-restore"
    );
const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

// --- admin id token ---------------------------------------------------------

/**
 * Exchanges an Admin SDK custom token for a real Firebase ID token, so the
 * calls below travel the same path a signed-in admin browser would.
 */
async function adminIdToken(): Promise<string> {
    const user = await adminAuth.getUserByEmail(ADMIN_EMAIL);
    const customToken = await adminAuth.createCustomToken(user.uid);
    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        }
    );
    const body = await response.json();
    if (!response.ok || !body.idToken) {
        throw new Error(`signInWithCustomToken failed: ${JSON.stringify(body)}`);
    }
    return body.idToken as string;
}

// --- 1. restore the deleted Nexus product -----------------------------------

async function restoreDeletedProduct() {
    const existing = await db.collection("products").doc(RESTORED_PRODUCT_ID).get();
    if (existing.exists) {
        console.log(`products/${RESTORED_PRODUCT_ID}: already exists — updating in place`);
    } else {
        console.log(`products/${RESTORED_PRODUCT_ID}: restoring the deleted product`);
    }

    const parsed = parseRepoInput(RESTORED_REPO);
    if (!parsed) throw new Error(`could not parse the repository "${RESTORED_REPO}"`);
    const repo = await fetchGitHubRepoServer(parsed.owner, parsed.repo);
    const mapped = mapRepoToProduct(repo);

    // `mapRepoToProduct` is exactly what the admin console writes when a
    // repository is linked, so the restored document carries the same
    // `github` snapshot shape and a later `sync-all` run updates it in place.
    const snapshot = {
        owner: repo.owner,
        repo: repo.repo,
        htmlUrl: repo.htmlUrl,
        description: repo.description,
        stars: repo.stars,
        forks: repo.forks,
        watchers: repo.watchers,
        openIssues: repo.openIssues,
        language: repo.language,
        topics: repo.topics,
        license: repo.license,
        homepage: repo.homepage,
        defaultBranch: repo.defaultBranch,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
        archived: repo.archived,
        avatarUrl: repo.avatarUrl,
        releaseTag: repo.release?.tagName ?? null,
        syncedAt: new Date().toISOString(),
        lastMapped: {},
    };

    const latestRelease = repo.release?.htmlUrl ?? "";
    const downloadUrl =
        "https://github.com/justaman045/WealthSync/releases/download/v2.0.96/app-release.apk";

    const product = {
        name: "Finance Control",
        description:
            repo.description ??
            "Privacy-first personal finance manager with AI-powered SMS parsing and comprehensive wealth tracking.",
        price: RESTORED_PRICE,
        category: "Mobile App",
        imageUrl: repo.avatarUrl,
        images: [] as string[],
        features: mapped.features ?? [],
        demoUrl: repo.homepage || repo.htmlUrl,
        version: repo.release?.tagName?.replace(/^v/i, "") ?? "",
        downloadUrl,
        documentationUrl: repo.htmlUrl,
        longDescription: mapped.longDescription ?? repo.readme ?? repo.description ?? "",
        descriptionType: repo.readme ? "markdown" : "plain",
        repoUrl: repo.htmlUrl,
        github: snapshot,
        status: "live",
        // Two customers hold an active licence for this product.
        purchases: 2,
        createdAt: "2026-05-07T20:18:54.824Z",
        latestReleaseUrl: latestRelease,
    };

    await db.collection("products").doc(RESTORED_PRODUCT_ID).set(product, { merge: true });
    console.log(
        `  wrote products/${RESTORED_PRODUCT_ID} — "${product.name}" $${product.price}, version ${product.version || "n/a"}`
    );
}

// --- 2. mirror the SaaSWaitlist catalogue into Nexus -----------------------

/** Mirrors `toNexusPayload` from the companion app (`lib/nexus.ts`). */
function toNexusPayload(project: Record<string, unknown>) {
    const images = Array.isArray(project.images) ? (project.images as string[]) : [];
    const tags = Array.isArray(project.tags) ? (project.tags as string[]) : [];
    const techStack = Array.isArray(project.techStack) ? (project.techStack as string[]) : [];
    const pricing = typeof project.pricing === "string" ? project.pricing.trim() : "";
    const price = /^\d+(\.\d+)?$/.test(pricing) ? Number(pricing) : 0;

    return {
        name: String(project.title ?? ""),
        price,
        category: String(project.category ?? "").trim() || "General",
        status: project.status === "active" ? "live" : "upcoming",
        description: String(project.shortDescription ?? "").trim() || String(project.description ?? ""),
        longDescription: String(project.description ?? ""),
        descriptionType: "plain" as const,
        imageUrl: String(project.imageUrl ?? "").trim() || images[0] || "",
        images,
        demoUrl: String(project.websiteUrl ?? "") || "",
        features: tags.length ? tags : techStack,
    };
}

async function mirrorProjects(idToken: string) {
    const snapshot = await db.collection("projects").get();
    if (snapshot.empty) {
        console.log("no projects to mirror");
        return;
    }

    for (const projectDoc of snapshot.docs) {
        const project = projectDoc.data() as Record<string, unknown>;
        const existingNexusId =
            typeof project.nexusProductId === "string" ? project.nexusProductId : "";

        if (existingNexusId) {
            const mirrored = await db.collection("products").doc(existingNexusId).get();
            if (mirrored.exists) {
                console.log(
                    `projects/${projectDoc.id}: already mirrored as products/${existingNexusId} — skipping`
                );
                continue;
            }
            console.log(
                `projects/${projectDoc.id}: linked product products/${existingNexusId} is missing — re-mirroring`
            );
        }

        const payload = toNexusPayload(project);
        const response = await fetch(NEXUS_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(
                `mirroring projects/${projectDoc.id} failed (HTTP ${response.status}): ${JSON.stringify(body)}`
            );
        }
        const nexusId = String(body.id ?? "");
        if (!nexusId) throw new Error(`mirroring projects/${projectDoc.id} returned no id`);

        await projectDoc.ref.set({ nexusProductId: nexusId }, { merge: true });
        console.log(
            `projects/${projectDoc.id}: mirrored as products/${nexusId} — "${payload.name}" (${payload.status}, $${payload.price})`
        );
    }
}

// --- 3. create the missing settings/site document ---------------------------

async function restoreSiteSettings() {
    const existing = await db.collection("settings").doc("site").get();
    if (existing.exists) {
        console.log("settings/site: already exists — leaving it untouched");
        return;
    }
    await db.collection("settings").doc("site").set(defaultSiteSettings, { merge: true });
    console.log(`settings/site: created from defaultSiteSettings (${Object.keys(defaultSiteSettings).length} keys)`);
}

// --- run --------------------------------------------------------------------

console.log(`catalogue restore against ${PROJECT_ID}\n`);
await restoreDeletedProduct();
const idToken = await adminIdToken();
await mirrorProjects(idToken);
await restoreSiteSettings();
console.log("\ndone");
