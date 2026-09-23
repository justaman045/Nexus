import { createPublicKey, createVerify, type KeyObject } from "node:crypto";

interface JwkKey {
    kid?: string;
    kty?: string;
    n?: string;
    e?: string;
}

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const JWKS_TTL_MS = 60 * 60 * 1000;

let cachedKeys: { fetchedAt: number; keys: Map<string, KeyObject> } | null = null;

async function fetchSigningKeys(): Promise<Map<string, KeyObject>> {
    const res = await fetch(JWKS_URL);
    if (!res.ok) {
        throw new Error(`Failed to fetch Firebase signing keys: ${res.status}`);
    }
    const data = (await res.json()) as { keys?: JwkKey[] };
    const keys = new Map<string, KeyObject>();
    for (const k of data.keys ?? []) {
        if (!k.n || !k.e || !k.kid) continue;
        keys.set(k.kid, createPublicKey({ key: { kty: k.kty ?? "RSA", n: k.n, e: k.e }, format: "jwk" }));
    }
    return keys;
}

function decodeJsonSegment(segment: string): unknown {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
}

export interface FirebaseUserClaims {
    uid: string;
    email?: string;
    emailVerified?: boolean;
}

interface TokenHeader {
    alg?: string;
    kid?: string;
}

interface TokenClaims {
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    exp?: number;
}

export function assertValidTokenClaims(header: TokenHeader, claims: TokenClaims, projectId: string): void {
    if (header.alg !== "RS256") throw new Error("Unexpected token algorithm");
    if (claims.aud !== projectId) throw new Error("Token audience mismatch");
    if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Token issuer mismatch");
    if (!claims.exp || claims.exp * 1000 <= Date.now()) throw new Error("Token expired");
    if (!claims.sub) throw new Error("Token missing subject");
}

export async function verifyIdToken(token: string, projectId: string): Promise<FirebaseUserClaims> {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");
    const [headerSegment, payloadSegment, signatureSegment] = parts;

    const header = decodeJsonSegment(headerSegment) as TokenHeader;
    const claims = decodeJsonSegment(payloadSegment) as TokenClaims;
    assertValidTokenClaims(header, claims, projectId);
    if (!claims.sub) throw new Error("Token missing subject");

    if (!cachedKeys || Date.now() - cachedKeys.fetchedAt > JWKS_TTL_MS) {
        cachedKeys = { fetchedAt: Date.now(), keys: await fetchSigningKeys() };
    }
    const key = header.kid ? cachedKeys.keys.get(header.kid) : undefined;
    if (!key) throw new Error("Unknown signing key");

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerSegment}.${payloadSegment}`);
    if (!verifier.verify(key, signatureSegment, "base64url")) throw new Error("Token signature invalid");

    return {
        uid: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified === true,
    };
}