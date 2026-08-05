import { GET, POST } from "@/app/api/progress/route";

jest.mock("@/lib/supabase/route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null
      })
    },
    from: () => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: [
              { id: "e1", weight_kg: 72.5, recorded_at: "2025-07-01T08:00:00Z" },
              { id: "e2", weight_kg: 72.0, recorded_at: "2025-07-08T08:00:00Z" }
            ],
            error: null
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: "e3", weight_kg: 71.5, recorded_at: "2025-07-10T08:00:00Z" },
            error: null
          })
        })
      })
    })
  })
}));

describe("progress route GET", () => {
  it("returns 200 with entries for authenticated user", async () => {
    const response = await GET(
      new Request("http://localhost/api/progress", {
        headers: { authorization: "Bearer test-token" }
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.entries).toBeDefined();
    expect(Array.isArray(body.data.entries)).toBe(true);
    expect(body.data.entries).toHaveLength(2);
  });
});

describe("progress route POST", () => {
  it("returns 201 with entries on successful save", async () => {
    const response = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer test-token"
        },
        body: JSON.stringify({ weightKg: 71.5 })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.data.entries).toBeDefined();
  });

  it("returns 400 when weightKg is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer test-token"
        },
        body: JSON.stringify({})
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when weightKg is negative", async () => {
    const response = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer test-token"
        },
        body: JSON.stringify({ weightKg: -5 })
      })
    );
    expect(response.status).toBe(400);
  });
});
