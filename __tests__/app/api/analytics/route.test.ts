import { GET } from "@/app/api/analytics/route";

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
              { id: "e2", weight_kg: 72.0, recorded_at: "2025-07-08T08:00:00Z" },
              { id: "e3", weight_kg: 71.5, recorded_at: "2025-07-10T08:00:00Z" }
            ],
            error: null
          })
        })
      })
    })
  })
}));

describe("analytics route GET", () => {
  it("returns 200 with analytics snapshot for authenticated user", async () => {
    const response = await GET(
      new Request("http://localhost/api/analytics", {
        headers: { authorization: "Bearer test-token" }
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.entries).toBeDefined();
    expect(body.data.entries.length).toBe(3);
    expect(body.data.trend).toBeDefined();
    expect(Array.isArray(body.data.trend)).toBe(true);
    expect(body.data.metrics).toBeDefined();
    expect(Array.isArray(body.data.metrics)).toBe(true);
    expect(body.data.streakDays).toBeDefined();
    expect(typeof body.data.streakDays).toBe("number");
  });
});
