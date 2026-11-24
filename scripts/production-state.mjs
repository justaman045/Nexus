// Reports the live state of the shared `company-24267` project.
//
// The two apps share one Firestore project, so "is the catalogue empty?" is
// not a one-collection question — this prints every collection both apps own
// plus the orphaned records that break a customer dashboard.
//
// It also removes the probe documents that `verify-deployed-rules.mjs` and
// earlier debugging runs may have left behind, so the report stays truthful.
//
//   node scripts/production-state.mjs
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const env = readFileSync(".env.local", "utf8");
const envValue = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const PROJECT_ID = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "company-24267";
const ADMIN_EMAIL =
    envValue("NEXT_PUBLIC_ADMIN_EMAILS")?.split(",")[0]?.trim() ?? "developerlife69@gmail.com";

const app =
    getApps()[0] ??
    initializeApp(
        {
            credential: cert(JSON.parse(envValue("FIREBASE_SERVICE_ACCOUNT") ?? "{}")),
            projectId: PROJECT_ID,
        },
        "nexus-state"
    );
const db = getFirestore(app);
const auth = getAuth(app);

// --- auth users -------------------------------------------------------------

const users = await auth.listUsers(200);
console.log(`\n=== auth users (${users.users.length}) ===`);
for (const user of users.users) {
    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    console.log(
        `  ${user.email ?? "(no email)"}${isAdmin ? "  <- admin" : ""}  verified=${user.emailVerified} disabled=${user.disabled}`
    );
}

// --- collections -------------------------------------------------------------

const COLLECTIONS = [
    "products",
    "content",
    "settings",
    "contacts",
    "orders",
    "licenses",
    "projects",
    "waitlist",
    "taxonomy",
    "requests",
    "userProfiles",
    "users",
];

console.log(`\n=== collections ===`);
for (const collectionName of COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    console.log(`  ${collectionName}: ${snapshot.size}`);

    for (const document of snapshot.docs) {
        if (!document.id.startsWith("_probe") && !document.id.includes("probe")) continue;
        await document.ref.delete();
        console.log(`    deleted probe ${collectionName}/${document.id}`);
    }
}

// --- orphaned records --------------------------------------------------------

console.log(`\n=== orphaned licences (product no longer exists) ===`);
const products = await db.collection("products").get();
const productIds = new Set(products.docs.map((doc) => doc.id));
const licenses = await db.collection("licenses").get();
let orphaned = 0;
for (const license of licenses.docs) {
    const productId = String(license.data().productId ?? "");
    if (productIds.has(productId)) continue;
    orphaned++;
    console.log(
        `  licenses/${license.id}: productId=${productId} (${license.data().customerEmail}) — MISSING`
    );
}
if (orphaned === 0) console.log("  none");

// --- mirrored products -------------------------------------------------------

console.log(`\n=== companion mirror ===`);
const projects = await db.collection("projects").get();
for (const project of projects.docs) {
    const nexusProductId = String(project.data().nexusProductId ?? "");
    const linked = nexusProductId && productIds.has(nexusProductId);
    console.log(
        `  projects/${project.id} "${project.data().title}" → ${
            nexusProductId ? `products/${nexusProductId}` : "(not mirrored)"
        }${nexusProductId && !linked ? "  <- BROKEN LINK" : ""}`
    );
}

console.log("");
