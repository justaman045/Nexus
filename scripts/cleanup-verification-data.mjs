// Removes leftover verification documents from the live project.
//
// `scripts/verify-public-writes.mjs` cleans up after itself, but a run that
// is interrupted before the cleanup leaves a waitlist entry and a request
// behind. This script removes exactly those and restores the counters.
//
//   node scripts/cleanup-verification-data.mjs
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const env = readFileSync(".env.local", "utf8");
const envValue = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const PROJECT_ID = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "company-24267";
const app =
    getApps()[0] ??
    initializeApp(
        {
            credential: cert(JSON.parse(envValue("FIREBASE_SERVICE_ACCOUNT") ?? "{}")),
            projectId: PROJECT_ID,
        },
        "nexus-cleanup"
    );
const db = getFirestore(app);

const VERIFICATION_EMAIL = /^verify-\d+@example\.com$/;
const VERIFICATION_TITLE = /^Verification probe \d+$/;

// --- waitlist entries --------------------------------------------------------
const waitlist = await db.collection("waitlist").get();
const removedEntries = new Map();
for (const document of waitlist.docs) {
    const email = String(document.data().email ?? "");
    if (!VERIFICATION_EMAIL.test(email)) continue;
    const projectId = String(document.data().projectId ?? "");
    removedEntries.set(projectId, (removedEntries.get(projectId) ?? 0) + 1);
    await document.ref.delete();
    console.log(`deleted waitlist/${document.id}`);
}

// --- requests ----------------------------------------------------------------
const requests = await db.collection("requests").get();
for (const document of requests.docs) {
    const title = String(document.data().title ?? "");
    if (!VERIFICATION_TITLE.test(title)) continue;
    await document.ref.delete();
    console.log(`deleted requests/${document.id}`);
}

// --- restore the counters ----------------------------------------------------
// The counter is the number of waitlist entries per project, so it is
// re-derived from what is left in the collection.
const projects = await db.collection("projects").get();
for (const project of projects.docs) {
    const projectId = project.id;
    const entries = await db.collection("waitlist").where("projectId", "==", projectId).get();
    const expected = entries.size;
    const current = Number(project.data().waitlistCount ?? 0);
    if (current === expected) continue;
    await project.ref.set({ waitlistCount: expected }, { merge: true });
    console.log(`projects/${projectId}: waitlistCount ${current} -> ${expected}`);
}

console.log(
    `\nremoved ${removedEntries.size} project(s)' verification entries; counters reconciled with the waitlist collection`
);
