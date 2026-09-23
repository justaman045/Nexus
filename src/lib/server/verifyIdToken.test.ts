import { describe, it, expect } from "vitest";
import { assertValidTokenClaims } from "./verifyIdToken";

const PROJECT = "company-24267";
const baseClaims = {
    aud: PROJECT,
    iss: `https://securetoken.google.com/${PROJECT}`,
    sub: "abc123",
    exp: Math.floor(Date.now() / 1000) + 3600,
};

describe("assertValidTokenClaims", () => {
    it("accepts a valid token", () => {
        expect(() => assertValidTokenClaims({ alg: "RS256", kid: "k1" }, baseClaims, PROJECT)).not.toThrow();
    });

    it("rejects non-RS256 algorithms", () => {
        expect(() => assertValidTokenClaims({ alg: "HS256" }, baseClaims, PROJECT)).toThrow(/algorithm/);
    });

    it("rejects wrong audience", () => {
        expect(() => assertValidTokenClaims({ alg: "RS256" }, { ...baseClaims, aud: "other-project" }, PROJECT)).toThrow(/audience/);
    });

    it("rejects wrong issuer", () => {
        expect(() => assertValidTokenClaims({ alg: "RS256" }, { ...baseClaims, iss: "https://evil.example" }, PROJECT)).toThrow(/issuer/);
    });

    it("rejects expired tokens", () => {
        expect(() => assertValidTokenClaims({ alg: "RS256" }, { ...baseClaims, exp: Math.floor(Date.now() / 1000) - 60 }, PROJECT)).toThrow(/expired/);
    });

    it("rejects missing subject", () => {
        expect(() => assertValidTokenClaims({ alg: "RS256" }, { ...baseClaims, sub: undefined }, PROJECT)).toThrow(/subject/);
    });
});