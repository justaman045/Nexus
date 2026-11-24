// Exercises the SaaSWaitlist's public write paths against the live project.
//
// The waitlist signup is a transaction that creates the entry and bumps the
// project's public counter; the request form creates a request document.
// Both are anonymous writes, so they are the paths the deployed rules have to
// get exactly right.
//
// The script cleans up everything it creates and restores the counter.
//
//   node scripts/verify-public-writes.mjs
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import {
    collection,
    doc,
    getDoc,
    getFirestore,
    runTransaction,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

const env = readFileSync(".env.local", "utf8");
const envValue = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const PROJECT_ID = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "company-24267";
const API_KEY = envValue("NEXT_PUBLIC_FIREBASE_API_KEY") ?? "";

const app = initializeApp({
    apiKey: API_KEY,
    projectId: PROJECT_ID,
});
const db = getFirestore(app);

const PROJECT_ID_UNDER_TEST = "DcHhUAqVMlxfwyL04VXq";
const TEST_EMAIL = `verify-${Date.now()}@example.com`;
const REQUEST_TITLE = `Verification probe ${Date.now()}`;

let passed = 0;
let failed = 0;

async function check(label, fn, expectation) {
    try {
        const result = await fn();
        const denied = String(result?.code ?? "") === "permission-denied";
        if (denied && expectation === "deny") {
            passed++;
            console.log(`  PASS  ${label} (denied, as expected)`);
        } else if (!denied && expectation === "allow") {
            passed++;
            console.log(`  PASS  ${label} (allowed, as expected)`);
        } else {
            failed++;
            console.log(`  FAIL  ${label} (${denied ? "denied" : "allowed"}, expected ${expectation})`);
        }
    } catch (error) {
        const denied =
            String(error?.code ?? "") === "permission-denied" ||
            /PERMISSION_DENIED|Missing or insufficient permissions/.test(String(error?.message ?? ""));
        if (denied && expectation === "deny") {
            passed++;
            console.log(`  PASS  ${label} (denied, as expected)`);
        } else {
            failed++;
            console.log(`  FAIL  ${label} (threw: ${error?.message ?? error}, expected ${expectation})`);
        }
    }
}

console.log(`\npublic-write check against ${PROJECT_ID}\n`);

const projectRef = doc(db, "projects", PROJECT_ID_UNDER_TEST);
const before = (await getDoc(projectRef)).data()?.waitlistCount ?? 0;
console.log(`project ${PROJECT_ID_UNDER_TEST}: waitlistCount=${before}`);

// --- waitlist signup (the real transaction the form runs) --------------------

console.log("\n--- waitlist signup ---");
await check(
    "sign up for the waitlist (entry + counter bump in one transaction)",
    async () => {
        const waitlistRef = doc(db, "waitlist", `${PROJECT_ID_UNDER_TEST}_${TEST_EMAIL}`);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(projectRef);
            if (!snap.exists()) throw new Error("Project not found");
            const current = snap.data().waitlistCount;
            transaction.set(waitlistRef, {
                projectId: PROJECT_ID_UNDER_TEST,
                email: TEST_EMAIL,
                createdAt: serverTimestamp(),
            });
            transaction.update(projectRef, {
                waitlistCount: (typeof current === "number" ? current : 0) + 1,
            });
        });
    },
    "allow"
);

const after = (await getDoc(projectRef)).data()?.waitlistCount ?? 0;
if (after === before + 1) {
    passed++;
    console.log(`  PASS  the counter moved from ${before} to ${after}`);
} else {
    failed++;
    console.log(`  FAIL  the counter moved from ${before} to ${after} (expected ${before + 1})`);
}

await check(
    "signing up twice with the same address is refused",
    async () => {
        const waitlistRef = doc(db, "waitlist", `${PROJECT_ID_UNDER_TEST}_${TEST_EMAIL}`);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(projectRef);
            const current = snap.data().waitlistCount;
            transaction.set(waitlistRef, {
                projectId: PROJECT_ID_UNDER_TEST,
                email: TEST_EMAIL,
                createdAt: serverTimestamp(),
            });
            transaction.update(projectRef, {
                waitlistCount: (typeof current === "number" ? current : 0) + 1,
            });
        });
    },
    "deny"
);

// The duplicate attempt must not have moved the counter again.
const afterDuplicate = (await getDoc(projectRef)).data()?.waitlistCount ?? 0;
if (afterDuplicate === after) {
    passed++;
    console.log(`  PASS  the counter is still ${afterDuplicate} after the refused signup`);
} else {
    failed++;
    console.log(`  FAIL  the counter moved to ${afterDuplicate} after a refused signup`);
}

// --- request submission ------------------------------------------------------

console.log("\n--- request submission ---");
const requestRef = doc(collection(db, "requests"));
await check(
    "submit a valid request",
    async () => {
        await setDoc(requestRef, {
            title: REQUEST_TITLE,
            description: "Created by scripts/verify-public-writes.mjs and deleted right after.",
            email: TEST_EMAIL,
            projectId: "",
            status: "new",
            createdAt: serverTimestamp(),
        });
    },
    "allow"
);
await check(
    "submit a request with a status other than 'new'",
    () =>
        setDoc(doc(collection(db, "requests")), {
            title: REQUEST_TITLE,
            description: "Should be rejected",
            email: TEST_EMAIL,
            projectId: "",
            status: "accepted",
            createdAt: serverTimestamp(),
        }),
    "deny"
);
await check(
    "submit a request with an invalid email",
    () =>
        setDoc(doc(collection(db, "requests")), {
            title: REQUEST_TITLE,
            description: "Should be rejected",
            email: "not-an-email",
            projectId: "",
            status: "new",
            createdAt: serverTimestamp(),
        }),
    "deny"
);
await check(
    "submit a request for a project that does not exist",
    () =>
        setDoc(doc(collection(db, "requests")), {
            title: REQUEST_TITLE,
            description: "Should be rejected",
            email: TEST_EMAIL,
            projectId: "does-not-exist",
            status: "new",
            createdAt: serverTimestamp(),
        }),
    "deny"
);

// --- cleanup -----------------------------------------------------------------
// The rules deny anonymous deletes, so the cleanup has to go through the
// Admin SDK — the same path a server-side cleanup would take.

console.log("\n--- cleanup ---");
const { cert, getApps, initializeApp: initAdminApp } = await import("firebase-admin/app");
const { getFirestore: getAdminFirestore } = await import("firebase-admin/firestore");
const adminApp =
    getApps()[0] ??
    initAdminApp(
        {
            credential: cert(JSON.parse(envValue("FIREBASE_SERVICE_ACCOUNT") ?? "{}")),
            projectId: PROJECT_ID,
        },
        "nexus-public-writes"
    );
const adminDb = getAdminFirestore(adminApp);

await adminDb.collection("waitlist").doc(`${PROJECT_ID_UNDER_TEST}_${TEST_EMAIL}`).delete();
await adminDb.collection("projects").doc(PROJECT_ID_UNDER_TEST).set({ waitlistCount: before }, { merge: true });
await adminDb.collection("requests").doc(requestRef.id).delete();

const restored = (await getDoc(projectRef)).data()?.waitlistCount ?? 0;
const requests = await adminDb.collection("requests").get();
const leftovers = await adminDb
    .collection("waitlist")
    .where("email", "==", TEST_EMAIL)
    .get();
console.log(
    `  waitlistCount restored to ${restored}; ${requests.size} request(s) and ${leftovers.size} waitlist entry left`
);

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
