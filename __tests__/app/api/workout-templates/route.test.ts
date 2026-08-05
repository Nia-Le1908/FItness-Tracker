jest.mock("@/lib/supabase/anon-client", () => ({
  createSupabaseAnonClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          }),
          ilike: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            })
          }),
          or: function (this: any) { return this; },
          order: function (this: any) {
            return { limit: () => Promise.resolve({ data: [], error: null }) };
          },
          limit: () => Promise.resolve({ data: [], error: null })
        })
      })
    })
  })
}));

import { GET } from "@/app/api/workout-templates/route";

describe("workout-templates route GET", () => {
  it("returns 404 when template not found by key", async () => {
    const response = await GET(
      new Request("http://localhost/api/workout-templates?key=unknown")
    );
    expect(response.status).toBe(404);
  });
});
