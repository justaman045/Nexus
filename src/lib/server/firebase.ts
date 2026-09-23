import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getAdminApp() {
    const existing = getApps().find((a) => a.name === "nexus-server");
    if (existing) return existing;

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const serviceAccount: ServiceAccount = {
        projectId: typeof parsed.project_id === "string" ? parsed.project_id : undefined,
        clientEmail: typeof parsed.client_email === "string" ? parsed.client_email : undefined,
        privateKey: typeof parsed.private_key === "string" ? parsed.private_key : undefined,
    };
    return initializeApp({ credential: cert(serviceAccount) }, "nexus-server");
}

export function getDb() {
    return getFirestore(getAdminApp());
}

export function getServerTimestamp() {
    return FieldValue.serverTimestamp();
}