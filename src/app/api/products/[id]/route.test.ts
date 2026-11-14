import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

const mockDocs: Record<string, unknown> = {};

const mockCollectionDoc = vi.fn((id: string) => ({
    get: vi.fn(async () => {
        const found = mockDocs[id];
        return {
            id,
            exists: !!found,
            data: () => found,
        };
    }),
}));

const mockCollection = {
    doc: mockCollectionDoc,
};

const mockDbCollection = vi.fn(() => mockCollection);
const mockDb = {
    collection: mockDbCollection,
};

vi.mock("@/lib/server/firebase", () => ({
    getDb: () => mockDb,
}));

vi.mock("@/lib/server/verifyIdToken", () => ({
    verifyIdToken: vi.fn(),
}));

const resetMocks = () => {
    Object.keys(mockDocs).forEach((k) => delete mockDocs[k]);
    mockDbCollection.mockClear();
    mockCollectionDoc.mockClear();
};

beforeEach(resetMocks);
afterEach(resetMocks);

describe("GET /api/products/[id]", () => {
    it("returns a single product with all details", async () => {
        mockDocs["p1"] = {
            name: "DevFlow Pro",
            description: "Project management",
            longDescription: "Full description",
            descriptionType: "plain",
            price: 49,
            imageUrl: "https://example.com/img.jpg",
            features: ["Git", "CI/CD"],
            category: "Developer Tool",
            demoUrl: "https://example.com/demo",
            version: "1.0.0",
            downloadUrl: "https://example.com/dl",
            documentationUrl: "https://example.com/docs",
            repoUrl: "https://github.com/owner/repo",
            github: { stars: 100 },
            purchases: 1250,
            createdAt: "2023-01-15T10:00:00Z",
            status: "live",
        };

        const res = await GET(new Request("http://localhost/api/products/p1"), {
            params: { id: "p1" } as unknown as Promise<{ id: string }>,
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.id).toBe("p1");
        expect(body.name).toBe("DevFlow Pro");
        expect(body.price).toBe(49);
        expect(body.category).toBe("Developer Tool");
        expect(body.status).toBe("live");
        expect(body.features).toEqual(["Git", "CI/CD"]);
    });

    it("returns 404 when product does not exist", async () => {
        const res = await GET(new Request("http://localhost/api/products/nonexistent"), {
            params: { id: "nonexistent" } as unknown as Promise<{ id: string }>,
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.error).toBe("Product not found");
    });

    it("hides a product with no status (treated as draft) from the public", async () => {
        mockDocs["p1"] = { name: "No Status", price: 10, category: "Design", createdAt: "2023-01-01T00:00:00Z" };

        const res = await GET(new Request("http://localhost/api/products/p1"), {
            params: { id: "p1" } as unknown as Promise<{ id: string }>,
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.error).toBe("Product not found");
    });

    it("returns draft products to admins", async () => {
        mockDocs["p1"] = { name: "Draft", price: 10, category: "Design", status: "draft" };
        const { verifyIdToken } = await import("@/lib/server/verifyIdToken");
        vi.mocked(verifyIdToken).mockResolvedValue({
            uid: "admin-uid",
            email: "developerlife69@gmail.com",
            emailVerified: true,
        });
        process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: "test-project" });
        process.env.NEXT_PUBLIC_ADMIN_EMAILS = "developerlife69@gmail.com";

        const res = await GET(
            new Request("http://localhost/api/products/p1", {
                headers: { authorization: "Bearer admin-token" },
            }),
            { params: { id: "p1" } as unknown as Promise<{ id: string }> }
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe("draft");
    });

    it("never exposes download links to public callers", async () => {
        mockDocs["p1"] = {
            name: "Live",
            price: 10,
            category: "Design",
            status: "live",
            downloadUrl: "https://example.com/secret.zip",
            repoUrl: "https://github.com/owner/private",
        };

        const res = await GET(new Request("http://localhost/api/products/p1"), {
            params: { id: "p1" } as unknown as Promise<{ id: string }>,
        });
        const body = await res.json();

        expect(body.downloadUrl).toBeUndefined();
        expect(body.repoUrl).toBeUndefined();
    });
});
