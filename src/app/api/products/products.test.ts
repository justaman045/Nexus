import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyIdToken } from "@/lib/server/verifyIdToken";
import { GET, POST } from "./route";

const mockDocs: Record<string, unknown>[] = [];

const mockCollection = {
    get: vi.fn(),
    add: vi.fn(),
    doc: vi.fn(),
};

const mockDb = {
    collection: vi.fn(() => mockCollection),
};

vi.mock("../../../lib/server/firebase", () => ({
    getDb: () => mockDb,
}));

vi.mock("../../../lib/server/verifyIdToken", () => ({
    verifyIdToken: vi.fn(),
}));

vi.mock("../../../lib/cms", () => ({
    getHomepageContent: vi.fn(async () => ({ categories: [] })),
}));

// Set required env vars for the route handlers
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: "test-project" });
process.env.NEXT_PUBLIC_ADMIN_EMAILS = "developerlife69@gmail.com";

const ADMIN_TOKEN = "valid-admin-token";
const ADMIN_CLAIMS = {
    uid: "admin-uid",
    email: "developerlife69@gmail.com",
    emailVerified: true,
};

const resetMocks = () => {
    mockDocs.length = 0;
    vi.resetAllMocks();

    mockCollection.get.mockImplementation(async () => ({
        empty: mockDocs.length === 0,
        docs: mockDocs.map((d) => ({ id: d.id, data: () => d.data })),
    }));
    mockCollection.add.mockImplementation(async (data: Record<string, unknown>) => {
        const id = `doc_${Date.now()}`;
        mockDocs.push({ id, data });
        return { id };
    });
    mockCollection.doc.mockImplementation((id: string) => ({
        get: vi.fn(async () => {
            const found = mockDocs.find((d) => d.id === id);
            return {
                id,
                exists: !!found,
                data: () => found,
            };
        }),
    }));
};

beforeEach(resetMocks);
afterEach(resetMocks);

describe("GET /api/products", () => {
    it("returns empty products with categories and summary when no products exist", async () => {
        const res = await GET(new Request("http://localhost/api/products"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.products).toEqual([]);
        expect(body.categories).toEqual([]);
        expect(body.summary).toEqual({ live: 0, upcoming: 0, draft: 0, archived: 0, total: 0 });
    });

    it("returns all products with full details", async () => {
        mockDocs.push({
            id: "p1",
            data: {
                name: "DevFlow Pro",
                description: "Project management tool",
                longDescription: "A full description",
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
                github: { stars: 100, owner: "owner", repo: "repo" },
                purchases: 1250,
                createdAt: "2023-01-15T10:00:00Z",
                status: "live",
            },
        });

        const res = await GET(new Request("http://localhost/api/products"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.products).toHaveLength(1);
        expect(body.products[0].name).toBe("DevFlow Pro");
        expect(body.products[0].status).toBe("live");
        expect(body.categories).toContain("Developer Tool");
        expect(body.summary).toEqual({ live: 1, upcoming: 0, draft: 0, archived: 0, total: 1 });
    });

    it("treats missing status as draft (admin view)", async () => {
        mockDocs.push({
            id: "p1",
            data: { name: "No Status", price: 10, category: "Design", createdAt: "2023-01-01T00:00:00Z" },
        });
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const res = await GET(
            new Request("http://localhost/api/products", {
                headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
            })
        );
        const body = await res.json();

        expect(body.products[0].status).toBe("draft");
        expect(body.summary.draft).toBe(1);
    });

    it("hides non-live products from public callers", async () => {
        mockDocs.push(
            { id: "p1", data: { name: "Live", price: 10, category: "A", status: "live", createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p2", data: { name: "Draft", price: 20, category: "A", status: "draft", createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p3", data: { name: "Archived", price: 30, category: "A", status: "archived", createdAt: "2023-01-01T00:00:00Z" } }
        );

        const res = await GET(new Request("http://localhost/api/products"));
        const body = await res.json();

        expect(body.products).toHaveLength(1);
        expect(body.products[0].name).toBe("Live");
        // Summary still describes the whole catalogue.
        expect(body.summary).toEqual({ live: 1, upcoming: 0, draft: 1, archived: 1, total: 3 });
    });

    it("never exposes download links to public callers", async () => {
        mockDocs.push({
            id: "p1",
            data: {
                name: "Live",
                price: 10,
                category: "A",
                status: "live",
                downloadUrl: "https://example.com/secret.zip",
                repoUrl: "https://github.com/owner/private",
                createdAt: "2023-01-01T00:00:00Z",
            },
        });

        const res = await GET(new Request("http://localhost/api/products"));
        const body = await res.json();

        expect(body.products[0].downloadUrl).toBeUndefined();
        expect(body.products[0].repoUrl).toBeUndefined();
    });

    it("filters by status=live", async () => {
        mockDocs.push(
            {
                id: "p1",
                data: { name: "Live One", price: 10, category: "A", status: "live", createdAt: "2023-01-01T00:00:00Z" },
            },
            {
                id: "p2",
                data: { name: "Draft One", price: 20, category: "A", status: "draft", createdAt: "2023-01-01T00:00:00Z" },
            }
        );

        const res = await GET(new Request("http://localhost/api/products?status=live"));
        const body = await res.json();

        expect(body.products).toHaveLength(1);
        expect(body.products[0].name).toBe("Live One");
        expect(body.summary.total).toBe(2);
    });

    it("filters by category", async () => {
        mockDocs.push(
            { id: "p1", data: { name: "Design Tool", price: 10, category: "Design", status: "live", createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p2", data: { name: "Dev Tool", price: 20, category: "Developer Tool", status: "live", createdAt: "2023-01-01T00:00:00Z" } }
        );

        const res = await GET(new Request("http://localhost/api/products?category=Design"));
        const body = await res.json();

        expect(body.products).toHaveLength(1);
        expect(body.products[0].name).toBe("Design Tool");
    });

    it("sorts by purchases descending by default", async () => {
        mockDocs.push(
            { id: "p1", data: { name: "Low", price: 10, category: "A", status: "live", purchases: 5, createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p2", data: { name: "High", price: 20, category: "A", status: "live", purchases: 100, createdAt: "2023-01-01T00:00:00Z" } }
        );

        const res = await GET(new Request("http://localhost/api/products?sort=purchases"));
        const body = await res.json();

        expect(body.products[0].name).toBe("High");
        expect(body.products[1].name).toBe("Low");
    });

    it("sorts by createdAt descending", async () => {
        mockDocs.push(
            { id: "p1", data: { name: "Old", price: 10, category: "A", status: "live", purchases: 0, createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p2", data: { name: "New", price: 20, category: "A", status: "live", purchases: 0, createdAt: "2023-01-02T00:00:00Z" } }
        );

        const res = await GET(new Request("http://localhost/api/products?sort=createdAt"));
        const body = await res.json();

        expect(body.products[0].name).toBe("New");
    });

    it("sorts by name ascending", async () => {
        mockDocs.push(
            { id: "p1", data: { name: "Zebra", price: 10, category: "A", status: "live", purchases: 0, createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p2", data: { name: "Apple", price: 20, category: "A", status: "live", purchases: 0, createdAt: "2023-01-01T00:00:00Z" } }
        );

        const res = await GET(new Request("http://localhost/api/products?sort=name"));
        const body = await res.json();

        expect(body.products[0].name).toBe("Apple");
        expect(body.products[1].name).toBe("Zebra");
    });

    it("limits results", async () => {
        mockDocs.push(
            { id: "p1", data: { name: "One", price: 10, category: "A", status: "live", purchases: 0, createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p2", data: { name: "Two", price: 20, category: "A", status: "live", purchases: 0, createdAt: "2023-01-01T00:00:00Z" } },
            { id: "p3", data: { name: "Three", price: 30, category: "A", status: "live", purchases: 0, createdAt: "2023-01-01T00:00:00Z" } }
        );

        const res = await GET(new Request("http://localhost/api/products?limit=2"));
        const body = await res.json();

        expect(body.products).toHaveLength(2);
    });
});

describe("POST /api/products", () => {
    const validBody = {
        name: "New Product",
        price: 29,
        category: "Developer Tool",
        status: "live",
        description: "A test product",
        imageUrl: "https://example.com/img.jpg",
    };

    it("creates a product with valid admin token", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(validBody),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.id).toBeDefined();
        expect(body.name).toBe("New Product");
        expect(body.status).toBe("live");
        expect(body.price).toBe(29);
        expect(body.purchases).toBe(0);
        expect(body.createdAt).toBeDefined();
    });

    it("defaults status to draft when not provided", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ name: "No Status", price: 10, category: "Design" }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe("draft");
    });

    it("rejects missing authorization token", async () => {
        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(validBody),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
    });

    it("rejects unverified email", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue({ ...ADMIN_CLAIMS, emailVerified: false });

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(validBody),
        });

        const res = await POST(req);

        expect(res.status).toBe(403);
    });

    it("rejects email not in allowlist", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue({
            uid: "random-uid",
            email: "random@example.com",
            emailVerified: true,
        });

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(validBody),
        });

        const res = await POST(req);

        expect(res.status).toBe(403);
    });

    it("accepts the companion app schema (title/pricing/websiteUrl/techStack)", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                title: "Companion Product",
                pricing: 15,
                shortDescription: "Created by the companion app",
                websiteUrl: "https://example.com",
                techStack: ["Next.js", "Firebase"],
                category: "Mobile App",
                images: ["https://example.com/one.png", "https://example.com/two.png"],
                status: "live",
            }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.name).toBe("Companion Product");
        expect(body.description).toBe("Created by the companion app");
        expect(body.price).toBe(15);
        expect(body.demoUrl).toBe("https://example.com");
        expect(body.features).toEqual(["Next.js", "Firebase"]);
        // Cover image falls back to the first gallery image.
        expect(body.imageUrl).toBe("https://example.com/one.png");
        expect(body.images).toEqual([
            "https://example.com/one.png",
            "https://example.com/two.png",
        ]);
    });

    it("rejects missing product name", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ price: 10, category: "Design" }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Product name (or title) is required");
    });

    it("rejects negative price", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ name: "Bad", price: -5, category: "Design" }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Valid price (or pricing) is required");
    });

    it("rejects missing category", async () => {
        vi.mocked(verifyIdToken).mockResolvedValue(ADMIN_CLAIMS);

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                authorization: `Bearer ${ADMIN_TOKEN}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ name: "Bad", price: 10 }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Category is required");
    });
});
