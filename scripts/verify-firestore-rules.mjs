// Validates firestore.rules against the local Firestore emulator.
//
// The rules file is SHARED with the SaaSWaitlist app on project
// `company-24267`, so it has to satisfy BOTH apps' access patterns. This
// script therefore covers the Nexus collections (products, content, settings,
// contacts, orders, licenses) AND the SaaSWaitlist collections (projects,
// waitlist, taxonomy, requests) that live in the same file.
//
// Run it before every rules deploy:
//
//   npm run test:rules
//
// which expands to:
//   firebase emulators:exec --only auth,firestore --project demo-nexus \
//     --config scripts/firebase.emulator.json "node scripts/verify-firestore-rules.mjs"
//
// The emulator namespace is `demo-nexus`; no real credentials are involved.
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

const PROJECT_ID = "demo-nexus";
const AUTH_HOST = "http://127.0.0.1:9299";
const FIRESTORE_HOST = "http://127.0.0.1:8288";
const FIRESTORE_PORT = 8288;
const DOCS = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// The Web SDK is used for the one assertion that cannot be expressed with the
// raw REST API: a real Firestore transaction, which is exactly how the
// SaaSWaitlist signup flow writes the waitlist entry and bumps the counter.
const sdkApp = initializeApp({ apiKey: "fake-api-key", projectId: PROJECT_ID });
const sdkDb = getFirestore(sdkApp);
connectFirestoreEmulator(sdkDb, "127.0.0.1", FIRESTORE_PORT);

const ADMIN_EMAIL = "developerlife69@gmail.com";
const USER_EMAIL = "customer@example.com";
const PASSWORD = "local-test-password";

/** The Auth emulator accepts any API key; prefer the real one when present. */
function emulatorApiKey() {
  try {
    const env = readFileSync(".env.local", "utf8");
    return env.match(/^NEXT_PUBLIC_FIREBASE_API_KEY=(.*)$/m)?.[1]?.trim() || "fake-api-key";
  } catch {
    return "fake-api-key";
  }
}

const API_KEY = emulatorApiKey();

// --- auth emulator ---------------------------------------------------------

async function authRequest(path, body, admin = false) {
  const base = admin
    ? `${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`
    : `${AUTH_HOST}/identitytoolkit.googleapis.com/v1`;

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      ...(admin ? { Authorization: "Bearer owner" } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: response.ok, status: response.status, json };
}

/**
 * Creates the user if needed, marks the email verified and returns an id
 * token whose `email_verified` claim is true — `isAdmin()` requires it.
 */
async function createVerifiedUser(email) {
  let auth = await authRequest("/accounts:signInWithPassword", {
    email,
    password: PASSWORD,
    returnSecureToken: true,
  });

  if (!auth.ok) {
    auth = await authRequest("/accounts:signUp", {
      email,
      password: PASSWORD,
      returnSecureToken: true,
    });
    if (!auth.ok) throw new Error(`signUp failed for ${email}: ${JSON.stringify(auth.json)}`);
  }

  const localId = auth.json?.localId;
  if (!localId) throw new Error(`could not determine the uid for ${email}`);

  const update = await authRequest(
    "/accounts:update",
    { localId, email, password: PASSWORD, emailVerified: true },
    true
  );
  if (!update.ok) throw new Error(`verify failed for ${email}: ${JSON.stringify(update.json)}`);

  // Sign in again so the id token carries email_verified: true.
  const signIn = await authRequest("/accounts:signInWithPassword", {
    email,
    password: PASSWORD,
    returnSecureToken: true,
  });
  if (!signIn.ok) throw new Error(`signIn failed for ${email}: ${JSON.stringify(signIn.json)}`);

  const token = signIn.json.idToken;
  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  if (claims.email_verified !== true) throw new Error(`token for ${email} is not verified`);

  return token;
}

// --- firestore emulator ----------------------------------------------------

/**
 * @param {string|null} token  null = anonymous, "owner" = emulator admin
 *                              (bypasses rules — used for seeding).
 */
async function firestoreRequest(method, path, token, body) {
  const response = await fetch(`${FIRESTORE_HOST}${DOCS}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

/**
 * Creates or replaces a document.
 *
 * A PATCH without an `updateMask` REPLACES the document, so every field that
 * is not sent disappears. Partial updates therefore have to resend the whole
 * document — that way the rules see exactly the merged result and their
 * `diff()` check compares against the stored state.
 */
function setDoc(token, collectionPath, docId, fields) {
  return firestoreRequest("PATCH", `/${collectionPath}/${docId}`, token, { fields });
}

/** The seeded project's full field set, with overrides applied. */
function projectFields(overrides = {}) {
  return {
    title: s("Seed Project"),
    slug: s("seed-project"),
    status: s("active"),
    waitlistCount: i(0),
    ...overrides,
  };
}

/** Creates a document with a server-generated id. */
function addDoc(token, collectionPath, fields) {
  return firestoreRequest("POST", `/${collectionPath}`, token, { fields });
}

function getDoc(token, collectionPath, docId) {
  return firestoreRequest("GET", `/${collectionPath}/${docId}`, token);
}

function listDocs(token, collectionPath) {
  return firestoreRequest("GET", `/${collectionPath}?pageSize=100`, token);
}

function deleteDoc(token, collectionPath, docId) {
  return firestoreRequest("DELETE", `/${collectionPath}/${docId}`, token);
}

// --- field helpers ---------------------------------------------------------

const s = (value) => ({ stringValue: value });
const i = (value) => ({ integerValue: String(value) });
const bool = (value) => ({ booleanValue: value });
const ts = (value = new Date().toISOString()) => ({ timestampValue: value });
const arr = (values) => ({ arrayValue: { values } });

const CONTACT = {
  name: s("Jane Buyer"),
  email: s("jane@example.com"),
  subject: s("Question about a license"),
  message: s("Could I transfer a license to another machine?"),
  createdAt: ts(),
};

const REQUEST = {
  title: s("AI meeting notes"),
  description: s("Transcribes calls"),
  email: s("someone@example.com"),
  projectId: s(""),
  status: s("new"),
  createdAt: ts(),
};

// --- assertions ------------------------------------------------------------

let passed = 0;
let failed = 0;

/** True when the SDK threw a permission error instead of returning a response. */
function isPermissionDenied(error) {
  const code = error?.code;
  const message = String(error?.message ?? "");
  return (
    code === "permission-denied" ||
    code === 7 ||
    code === "PERMISSION_DENIED" ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("permission-denied")
  );
}

async function check(label, fn, expectation) {
  try {
    const result = await fn();
    const denied = result && result.ok === false;
    // HTTP 400 means the request was malformed and never reached the rules.
    // Treating it as a denial would turn a broken test into a false pass.
    const malformed = result && result.status === 400;
    if (malformed) {
      failed++;
      console.log(
        `  FAIL  ${label} (HTTP 400 — malformed request, the rules were never evaluated: ${String(result.text ?? "").slice(0, 300)})`
      );
      return;
    }
    if (denied && expectation === "deny") {
      passed++;
      console.log(`  PASS  ${label} (denied: HTTP ${result.status}, as expected)`);
    } else if (!denied && expectation === "allow") {
      passed++;
      console.log(`  PASS  ${label} (allowed, as expected)`);
    } else {
      failed++;
      console.log(
        `  FAIL  ${label} (${denied ? `denied: HTTP ${result.status}` : "allowed"}, expected ${expectation})`
      );
    }
  } catch (error) {
    // The Web SDK throws on a rejected write instead of returning a response.
    if (isPermissionDenied(error)) {
      if (expectation === "deny") {
        passed++;
        console.log(`  PASS  ${label} (denied: PERMISSION_DENIED, as expected)`);
      } else {
        failed++;
        console.log(`  FAIL  ${label} (denied: PERMISSION_DENIED, expected ${expectation})`);
      }
      return;
    }
    failed++;
    console.log(`  FAIL  ${label} (threw: ${error?.message ?? error}, expected ${expectation})`);
  }
}

// --- run -------------------------------------------------------------------

console.log(`\nemulator project: ${PROJECT_ID}`);

const adminToken = await createVerifiedUser(ADMIN_EMAIL);
const userToken = await createVerifiedUser(USER_EMAIL);
console.log("auth: seeded verified admin + customer");

// Seed the documents the rules refer to. The emulator's "owner" token
// bypasses rules, which is how a real deployment would seed them server-side.
await setDoc("owner", "projects", "seed-project", {
  title: s("Seed Project"),
  slug: s("seed-project"),
  status: s("active"),
  waitlistCount: i(0),
});
await setDoc("owner", "products", "seed-product", {
  name: s("Seed Product"),
  price: i(49),
  status: s("live"),
});
await setDoc("owner", "orders", "seed-order", {
  productId: s("seed-product"),
  status: s("paid"),
});
await setDoc("owner", "licenses", "seed-license", {
  productId: s("seed-product"),
  customerEmail: s("customer@example.com"),
  licenseKey: s("AAAA-BBBB-CCCC-DDDD"),
});
console.log("firestore: seeded projects/products/orders/licenses as emulator owner");

console.log("\n--- Nexus: products ---");
await check("anonymous read products", () => listDocs(null, "products"), "allow");
await check("anonymous create product", () => setDoc(null, "products", "nope", { name: s("x") }), "deny");
await check("anonymous update product", () => setDoc(null, "products", "seed-product", { name: s("x") }), "deny");
await check("anonymous delete product", () => deleteDoc(null, "products", "seed-product"), "deny");
await check("signed-in non-admin create product", () => setDoc(userToken, "products", "nope", { name: s("x") }), "deny");
await check("admin create product", () => setDoc(adminToken, "products", "admin-made", { name: s("Admin") }), "allow");
await check("admin update product", () => setDoc(adminToken, "products", "admin-made", { price: i(99) }), "allow");
await check("admin delete product", () => deleteDoc(adminToken, "products", "admin-made"), "allow");

console.log("\n--- Nexus: content ---");
await check("anonymous read content", () => listDocs(null, "content"), "allow");
await check("anonymous write content", () => setDoc(null, "content", "homepage_content", { hero: s("x") }), "deny");
await check("admin write content", () => setDoc(adminToken, "content", "homepage_content", { hero: s("x") }), "allow");

console.log("\n--- Nexus: settings ---");
await check("anonymous read settings", () => listDocs(null, "settings"), "allow");
await check("anonymous write settings", () => setDoc(null, "settings", "payment", { gateway: s("stripe") }), "deny");
await check("admin write settings", () => setDoc(adminToken, "settings", "payment", { gateway: s("razorpay") }), "allow");

console.log("\n--- Nexus: contacts ---");
await check("anonymous create contact", () => addDoc(null, "contacts", CONTACT), "deny");
await check("signed-in user create contact", () => addDoc(userToken, "contacts", CONTACT), "allow");
await check(
  "contact with an invalid email",
  () => addDoc(userToken, "contacts", { ...CONTACT, email: s("not-an-email") }),
  "deny"
);
await check(
  "contact with an uppercase email",
  () => addDoc(userToken, "contacts", { ...CONTACT, email: s("Jane@Example.com") }),
  "deny"
);
await check(
  "contact with whitespace in the email",
  () => addDoc(userToken, "contacts", { ...CONTACT, email: s(" jane@example.com ") }),
  "deny"
);
await check(
  "contact with a slash in the email",
  () => addDoc(userToken, "contacts", { ...CONTACT, email: s("ja/ne@example.com") }),
  "deny"
);
await check(
  "contact with an extra field",
  () => addDoc(userToken, "contacts", { ...CONTACT, sneaky: s("value") }),
  "deny"
);
await check(
  "contact with an oversized message",
  () => addDoc(userToken, "contacts", { ...CONTACT, message: s("x".repeat(5001)) }),
  "deny"
);
await check(
  "contact with an oversized name",
  () => addDoc(userToken, "contacts", { ...CONTACT, name: s("x".repeat(201)) }),
  "deny"
);
await check("anonymous read contacts", () => listDocs(null, "contacts"), "deny");
await check("admin read contacts", () => listDocs(adminToken, "contacts"), "deny");
await check("anonymous delete contacts", () => deleteDoc(null, "contacts", "anything"), "deny");

console.log("\n--- Nexus: orders (financial records) ---");
await check("anonymous read orders", () => listDocs(null, "orders"), "deny");
await check("signed-in non-admin read orders", () => listDocs(userToken, "orders"), "deny");
await check("admin read orders", () => listDocs(adminToken, "orders"), "allow");
await check("anonymous write orders", () => setDoc(null, "orders", "x", { status: s("paid") }), "deny");
await check("signed-in non-admin write orders", () => setDoc(userToken, "orders", "x", { status: s("paid") }), "deny");
await check("admin write orders", () => setDoc(adminToken, "orders", "x", { status: s("paid") }), "deny");

console.log("\n--- Nexus: licenses (financial records) ---");
await check("anonymous read licenses", () => listDocs(null, "licenses"), "deny");
await check("signed-in non-admin read licenses", () => listDocs(userToken, "licenses"), "deny");
await check("admin read licenses", () => listDocs(adminToken, "licenses"), "allow");
await check("anonymous write licenses", () => setDoc(null, "licenses", "x", { licenseKey: s("x") }), "deny");
await check("admin write licenses", () => setDoc(adminToken, "licenses", "x", { licenseKey: s("x") }), "deny");

console.log("\n--- Orphaned legacy collections ---");
await check("anonymous read userProfiles", () => listDocs(null, "userProfiles"), "deny");
await check("anonymous read users", () => listDocs(null, "users"), "deny");
await check("anonymous write userProfiles", () => setDoc(null, "userProfiles", "x", { tier: s("pro") }), "deny");

console.log("\n--- SaaSWaitlist: taxonomy ---");
await check("anonymous read taxonomy", () => listDocs(null, "taxonomy"), "allow");
await check(
  "anonymous write taxonomy",
  () => setDoc(null, "taxonomy", "categories", { values: arr([s("Hacked")]) }),
  "deny"
);
await check(
  "admin write taxonomy",
  () => setDoc(adminToken, "taxonomy", "categories", { values: arr([s("AI Tools")]) }),
  "allow"
);

console.log("\n--- SaaSWaitlist: projects ---");
await check("anonymous read projects", () => listDocs(null, "projects"), "allow");
await check("anonymous create project", () => setDoc(null, "projects", "sneaky", { title: s("x") }), "deny");
await check("anonymous delete project", () => deleteDoc(null, "projects", "seed-project"), "deny");
// The counter assertions below are order-dependent: the stored counter starts
// at 0 and only the first (+1) write is allowed, so every later assertion
// compares against the counter value that is actually stored.
await check(
  "public counter increment by exactly one",
  () => setDoc(null, "projects", "seed-project", projectFields({ waitlistCount: i(1) })),
  "allow"
);
await check(
  "public counter increment by more than one",
  () => setDoc(null, "projects", "seed-project", projectFields({ waitlistCount: i(99) })),
  "deny"
);
await check(
  "public counter decrement",
  () => setDoc(null, "projects", "seed-project", projectFields({ waitlistCount: i(0) })),
  "deny"
);
await check(
  "public update of another project field",
  () =>
    setDoc(
      null,
      "projects",
      "seed-project",
      projectFields({ title: s("Renamed"), waitlistCount: i(1) })
    ),
  "deny"
);
await check(
  "public update of the counter together with another field",
  () =>
    setDoc(
      null,
      "projects",
      "seed-project",
      projectFields({ waitlistCount: i(2), title: s("Renamed") })
    ),
  "deny"
);
await check("admin create project", () => setDoc(adminToken, "projects", "admin-project", { title: s("Admin") }), "allow");
await check("admin update project", () => setDoc(adminToken, "projects", "admin-project", { title: s("Admin 2") }), "allow");
await check("admin delete project", () => deleteDoc(adminToken, "projects", "admin-project"), "allow");

console.log("\n--- SaaSWaitlist: waitlist ---");
await check("anonymous read waitlist", () => listDocs(null, "waitlist"), "deny");
await check("admin read waitlist", () => listDocs(adminToken, "waitlist"), "allow");
await check(
  "valid waitlist entry",
  () =>
    setDoc(null, "waitlist", "seed-project_someone@example.com", {
      projectId: s("seed-project"),
      email: s("someone@example.com"),
      createdAt: ts(),
    }),
  "allow"
);
await check(
  "waitlist entry with a mismatched document id",
  () =>
    setDoc(null, "waitlist", "seed-project_other@example.com", {
      projectId: s("seed-project"),
      email: s("someoneelse@example.com"),
      createdAt: ts(),
    }),
  "deny"
);
await check(
  "waitlist entry with an uppercase email",
  () =>
    setDoc(null, "waitlist", "seed-project_Mixed@example.com", {
      projectId: s("seed-project"),
      email: s("Mixed@example.com"),
      createdAt: ts(),
    }),
  "deny"
);
await check(
  "waitlist entry with whitespace in the email",
  () =>
    setDoc(null, "waitlist", "seed-project_spacey@example.com", {
      projectId: s("seed-project"),
      email: s(" spacey@example.com"),
      createdAt: ts(),
    }),
  "deny"
);
await check(
  "waitlist entry with a non-timestamp createdAt",
  () =>
    setDoc(null, "waitlist", "seed-project_stamped@example.com", {
      projectId: s("seed-project"),
      email: s("stamped@example.com"),
      createdAt: s("2026-01-01T00:00:00.000Z"),
    }),
  "deny"
);
await check(
  "waitlist entry missing the email field",
  () => setDoc(null, "waitlist", "seed-project_noemail", { projectId: s("seed-project"), createdAt: ts() }),
  "deny"
);
await check(
  "waitlist entry with an extra field",
  () =>
    setDoc(null, "waitlist", "seed-project_extra@example.com", {
      projectId: s("seed-project"),
      email: s("extra@example.com"),
      createdAt: ts(),
      sneaky: s("value"),
    }),
  "deny"
);
await check(
  "waitlist entry for a non-existent project",
  () =>
    setDoc(null, "waitlist", "does-not-exist_orphan@example.com", {
      projectId: s("does-not-exist"),
      email: s("orphan@example.com"),
      createdAt: ts(),
    }),
  "deny"
);
await check(
  "public update of a waitlist entry",
  () => setDoc(null, "waitlist", "seed-project_someone@example.com", { email: s("someoneelse@example.com") }),
  "deny"
);
await check(
  "public delete of a waitlist entry",
  () => deleteDoc(null, "waitlist", "seed-project_someone@example.com"),
  "deny"
);

// The real signup flow writes the waitlist entry and increments the counter
// in one transaction. This is the only path that must succeed end to end for
// the SaaSWaitlist landing page to work.
console.log("\n--- SaaSWaitlist: signup transaction ---");
await check(
  "transaction that creates an entry and bumps the counter",
  async () => {
    await runTransaction(sdkDb, async (transaction) => {
      const projectRef = doc(sdkDb, "projects", "seed-project");
      const projectSnap = await transaction.get(projectRef);
      const current = projectSnap.data()?.waitlistCount ?? 0;
      transaction.set(doc(sdkDb, "waitlist", "seed-project_ticket@example.com"), {
        projectId: "seed-project",
        email: "ticket@example.com",
        createdAt: serverTimestamp(),
      });
      transaction.update(projectRef, {
        waitlistCount: (typeof current === "number" ? current : 0) + 1,
      });
    });
  },
  "allow"
);
await check(
  "transaction that creates an entry for an unknown project",
  async () => {
    await runTransaction(sdkDb, async (transaction) => {
      const projectRef = doc(sdkDb, "projects", "ghost-project");
      transaction.set(doc(sdkDb, "waitlist", "ghost-project_ghost@example.com"), {
        projectId: "ghost-project",
        email: "ghost@example.com",
        createdAt: serverTimestamp(),
      });
      transaction.set(projectRef, {
        title: "Ghost",
        slug: "ghost-project",
        status: "active",
        waitlistCount: 1,
      });
    });
  },
  "deny"
);

console.log("\n--- SaaSWaitlist: requests ---");
await check("valid request (empty projectId)", () => addDoc(null, "requests", REQUEST), "allow");
await check(
  "valid request (existing projectId)",
  () => addDoc(null, "requests", { ...REQUEST, projectId: s("seed-project") }),
  "allow"
);
await check(
  "request missing the projectId field entirely",
  () => {
    const { projectId, ...withoutProjectId } = REQUEST;
    void projectId;
    return addDoc(null, "requests", withoutProjectId);
  },
  "deny"
);
await check(
  "request with a non-existent projectId",
  () => addDoc(null, "requests", { ...REQUEST, projectId: s("does-not-exist") }),
  "deny"
);
await check(
  "request trying to set status=accepted",
  () => addDoc(null, "requests", { ...REQUEST, status: s("accepted") }),
  "deny"
);
await check(
  "request with an invalid email",
  () => addDoc(null, "requests", { ...REQUEST, email: s("not-an-email") }),
  "deny"
);
await check("request with an empty title", () => addDoc(null, "requests", { ...REQUEST, title: s("") }), "deny");
await check("request with an extra field", () => addDoc(null, "requests", { ...REQUEST, sneaky: s("value") }), "deny");
await check("anonymous read requests", () => listDocs(null, "requests"), "deny");
await check("admin read requests", () => listDocs(adminToken, "requests"), "allow");
await check("anonymous update requests", () => setDoc(null, "requests", "x", { status: s("accepted") }), "deny");
await check("anonymous delete requests", () => deleteDoc(null, "requests", "x"), "deny");

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
