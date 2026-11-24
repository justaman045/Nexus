// Verifies the DEPLOYED Firestore rules on the live `company-24267` project.
//
// The emulator suite (`npm run test:rules`) proves the rules file is correct;
// this script proves the rules that are actually serving production match it.
//
// It uses the public Web SDK config (anonymous + a real signed-in admin) so
// the requests travel the exact same path a browser would take.
//
//   node scripts/verify-deployed-rules.mjs
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const env = readFileSync(".env.local", "utf8");
const envValue = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const PROJECT_ID = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "company-24267";
const API_KEY = envValue("NEXT_PUBLIC_FIREBASE_API_KEY") ?? "";
const ADMIN_EMAIL =
  envValue("NEXT_PUBLIC_ADMIN_EMAILS")?.split(",")[0]?.trim() ?? "developerlife69@gmail.com";

const app = initializeApp({ apiKey: API_KEY, projectId: PROJECT_ID });

let passed = 0;
let failed = 0;

async function check(label, fn, expectation) {
  try {
    await fn();
    if (expectation === "allow") {
      passed++;
      console.log(`  PASS  ${label} (allowed, as expected)`);
    } else {
      failed++;
      console.log(`  FAIL  ${label} (allowed, expected ${expectation})`);
    }
  } catch (error) {
    const denied =
      String(error?.code ?? "") === "permission-denied" ||
      /PERMISSION_DENIED|Missing or insufficient permissions/.test(String(error?.message ?? ""));
    if (denied && expectation === "deny") {
      passed++;
      console.log(`  PASS  ${label} (denied, as expected)`);
    } else if (!denied && expectation === "allow") {
      passed++;
      console.log(`  PASS  ${label} (allowed, as expected)`);
    } else {
      failed++;
      console.log(
        `  FAIL  ${label} (${denied ? "denied" : `threw: ${error?.message ?? error}`}, expected ${expectation})`
      );
    }
  }
}

// --- admin identity ---------------------------------------------------------
// The deployed rules read `request.auth.token.email` + `email_verified`, so the
// admin has to be a real Auth user (the one with the matching email) and the
// custom token has to be minted for that user's UID.
async function adminCredentials() {
  const { cert, getApps, initializeApp: initAdmin } = await import("firebase-admin/app");
  const { getAuth: getAdminAuth } = await import("firebase-admin/auth");
  const raw = envValue("FIREBASE_SERVICE_ACCOUNT");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set in .env.local");
  const adminApp =
    getApps()[0] ??
    initAdmin({
      credential: cert(JSON.parse(raw)),
      projectId: PROJECT_ID,
    });
  const adminAuth = getAdminAuth(adminApp);
  const user = await adminAuth.getUserByEmail(ADMIN_EMAIL);
  const token = await adminAuth.createCustomToken(user.uid);
  return { token, uid: user.uid };
}

console.log(`\ndeployed-rules check against ${PROJECT_ID}`);
console.log(`admin: ${ADMIN_EMAIL}\n`);

// --- anonymous access --------------------------------------------------------

const anonymousDb = getFirestore(app);

console.log("--- public reads ---");
await check("anonymous read products", () => getDocs(collection(anonymousDb, "products")), "allow");
await check("anonymous read content", () => getDocs(collection(anonymousDb, "content")), "allow");
await check("anonymous read settings", () => getDocs(collection(anonymousDb, "settings")), "allow");
await check("anonymous read projects", () => getDocs(collection(anonymousDb, "projects")), "allow");
await check("anonymous read taxonomy", () => getDocs(collection(anonymousDb, "taxonomy")), "allow");

console.log("\n--- protected reads ---");
await check("anonymous read orders", () => getDocs(collection(anonymousDb, "orders")), "deny");
await check("anonymous read licenses", () => getDocs(collection(anonymousDb, "licenses")), "deny");
await check("anonymous read waitlist", () => getDocs(collection(anonymousDb, "waitlist")), "deny");
await check("anonymous read requests", () => getDocs(collection(anonymousDb, "requests")), "deny");
await check("anonymous read contacts", () => getDocs(collection(anonymousDb, "contacts")), "deny");
await check("anonymous read userProfiles (orphaned legacy)", () => getDocs(collection(anonymousDb, "userProfiles")), "deny");
await check("anonymous read users (orphaned legacy)", () => getDocs(collection(anonymousDb, "users")), "deny");

console.log("\n--- protected writes ---");
await check("anonymous create product", () => setDoc(doc(anonymousDb, "products", "_probe"), { name: "probe" }), "deny");
await check(
  "anonymous create contact",
  () =>
    setDoc(doc(anonymousDb, "contacts", "_probe"), {
      name: "Probe",
      email: "probe@example.com",
      subject: "Probe",
      message: "Probe",
      createdAt: serverTimestamp(),
    }),
  "deny"
);
await check("anonymous create order", () => setDoc(doc(anonymousDb, "orders", "_probe"), { status: "paid" }), "deny");
await check("anonymous create license", () => setDoc(doc(anonymousDb, "licenses", "_probe"), { licenseKey: "x" }), "deny");
await check("anonymous create project", () => setDoc(doc(anonymousDb, "projects", "_probe"), { title: "Probe" }), "deny");
await check("anonymous delete project", () => deleteDoc(doc(anonymousDb, "projects", "_probe")), "deny");
await check(
  "anonymous create waitlist for an unknown project",
  () =>
    setDoc(doc(anonymousDb, "waitlist", "_probe_nobody@example.com"), {
      projectId: "_probe",
      email: "nobody@example.com",
      createdAt: serverTimestamp(),
    }),
  "deny"
);
await check(
  "anonymous create request with a rejected status",
  () =>
    setDoc(doc(anonymousDb, "requests", "_probe_rejected"), {
      title: "Probe",
      description: "Probe",
      email: "probe@example.com",
      projectId: "",
      status: "accepted",
      createdAt: serverTimestamp(),
    }),
  "deny"
);

// The public feature-request form is the one anonymous *write* that is
// allowed by design. It is created here and removed again by the Admin SDK so
// the production collection stays clean.
const validRequestId = `_probe_request_${Date.now()}`;
await check(
  "anonymous create request (public feature-request form)",
  () =>
    setDoc(doc(anonymousDb, "requests", validRequestId), {
      title: "Rules verification probe",
      description: "Created by scripts/verify-deployed-rules.mjs and deleted right after.",
      email: "probe@example.com",
      projectId: "",
      status: "new",
      createdAt: serverTimestamp(),
    }),
  "allow"
);

// --- admin access ------------------------------------------------------------

console.log("\n--- admin access ---");
const { token } = await adminCredentials();
await signInWithCustomToken(getAuth(app), token);

const adminDb = getFirestore(app);

await check("admin read orders", () => getDocs(collection(adminDb, "orders")), "allow");
await check("admin read licenses", () => getDocs(collection(adminDb, "licenses")), "allow");
await check("admin read waitlist", () => getDocs(collection(adminDb, "waitlist")), "allow");
await check("admin read requests", () => getDocs(collection(adminDb, "requests")), "allow");
await check("admin create product", () => setDoc(doc(adminDb, "products", "_probe_admin"), { name: "Probe", status: "draft" }), "allow");
await check("admin update product", () => setDoc(doc(adminDb, "products", "_probe_admin"), { name: "Probe 2", status: "draft" }), "allow");
await check("admin delete product probe", () => deleteDoc(doc(adminDb, "products", "_probe_admin")), "allow");
await check("admin create project", () => setDoc(doc(adminDb, "projects", "_probe_admin"), { title: "Probe", status: "active" }), "allow");
await check("admin update project", () => setDoc(doc(adminDb, "projects", "_probe_admin"), { title: "Probe 2", status: "active" }), "allow");
await check("admin delete project probe", () => deleteDoc(doc(adminDb, "projects", "_probe_admin")), "allow");

// --- cleanup -----------------------------------------------------------------

const { getFirestore: getAdminFirestore } = await import("firebase-admin/firestore");
const { cert, getApps, initializeApp: initAdmin } = await import("firebase-admin/app");
const adminApp =
  getApps()[0] ??
  initAdmin({
    credential: cert(JSON.parse(envValue("FIREBASE_SERVICE_ACCOUNT"))),
    projectId: PROJECT_ID,
  });
const cleanupDb = getAdminFirestore(adminApp);
await cleanupDb.collection("requests").doc(validRequestId).delete();
console.log(`\ncleaned up requests/${validRequestId}`);

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
