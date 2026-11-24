// Mints a real Firebase ID token for the admin so the companion's
// `/api/nexus` proxy and the admin-only API routes can be exercised against
// production exactly like a signed-in browser.
//
//   node scripts/mint-admin-token.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const env = readFileSync(".env.local", "utf8");
const envValue = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const PROJECT_ID = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "company-24267";
const API_KEY = envValue("NEXT_PUBLIC_FIREBASE_API_KEY") ?? "";
const ADMIN_EMAIL =
    envValue("NEXT_PUBLIC_ADMIN_EMAILS")?.split(",")[0]?.trim() ?? "developerlife69@gmail.com";

const app =
    getApps()[0] ??
    initializeApp(
        {
            credential: cert(JSON.parse(envValue("FIREBASE_SERVICE_ACCOUNT") ?? "{}")),
            projectId: PROJECT_ID,
        },
        "nexus-token"
    );

const adminAuth = getAuth(app);
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
    console.error("signInWithCustomToken failed:", JSON.stringify(body));
    process.exit(1);
}

const out = process.argv[2] ?? "/tmp/opencode/admin-token.txt";
writeFileSync(out, body.idToken, "utf8");
console.log(`admin id token written to ${out} (uid ${user.uid}, email ${user.email})`);
