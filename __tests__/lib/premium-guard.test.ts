import { ForbiddenError } from "@/lib/api/route-errors";
import { assertSavedPlanLimit, resolveUserTier } from "@/lib/api/premium-guard";
import { getPlanLimit } from "@/lib/premium";

type MockOptions = {
  tier: string | null;
  status: string | null;
  count: number;
};

function mockSupabase(opts: MockOptions) {
  const from = jest.fn().mockImplementation((table: string) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockImplementation((_col: string, _val: string) => {
        if (table === "billing_entitlements") {
          return {
            maybeSingle: jest.fn().mockResolvedValue({
              data: opts.tier ? { tier: opts.tier, status: opts.status } : null,
              error: null
            })
          };
        }
        return Promise.resolve({ data: null, error: null, count: opts.count });
      })
    })
  }));
  return { from } as Parameters<typeof resolveUserTier>[0] & { from: jest.Mock };
}

describe("getPlanLimit", () => {
  it("caps free tier at 1 saved plan", () => {
    expect(getPlanLimit("free", "savedPlans")).toBe(1);
    expect(getPlanLimit(null, "savedPlans")).toBe(1);
    expect(getPlanLimit(undefined, "savedPlans")).toBe(1);
  });

  it("gives unlimited plans to premium/annual", () => {
    expect(getPlanLimit("premium", "savedPlans")).toBe(Infinity);
    expect(getPlanLimit("annual", "savedPlans")).toBe(Infinity);
  });
});

describe("resolveUserTier", () => {
  it("returns free when no entitlement row exists", async () => {
    const supabase = mockSupabase({ tier: null, status: null, count: 0 });
    await expect(resolveUserTier(supabase, "user-1")).resolves.toBe("free");
  });

  it("returns free when entitlement is not active/trialing", async () => {
    const supabase = mockSupabase({ tier: "premium", status: "canceled", count: 0 });
    await expect(resolveUserTier(supabase, "user-1")).resolves.toBe("free");
  });

  it("returns premium for active premium entitlement", async () => {
    const supabase = mockSupabase({ tier: "premium", status: "active", count: 0 });
    await expect(resolveUserTier(supabase, "user-1")).resolves.toBe("premium");
  });

  it("returns annual for active annual entitlement", async () => {
    const supabase = mockSupabase({ tier: "annual", status: "trialing", count: 0 });
    await expect(resolveUserTier(supabase, "user-1")).resolves.toBe("annual");
  });
});

describe("assertSavedPlanLimit", () => {
  it("allows a free user with 0 saved plans", async () => {
    const supabase = mockSupabase({ tier: null, status: null, count: 0 });
    await expect(assertSavedPlanLimit(supabase, "user-1", "workout_plans")).resolves.toBe("free");
  });

  it("blocks a free user who already reached the plan limit", async () => {
    const supabase = mockSupabase({ tier: null, status: null, count: 1 });
    await expect(assertSavedPlanLimit(supabase, "user-1", "meal_plans")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("does not count existing plans for premium users", async () => {
    const supabase = mockSupabase({ tier: "premium", status: "active", count: 7 });
    await expect(assertSavedPlanLimit(supabase, "user-1", "macro_plans")).resolves.toBe("premium");
    const countCalls = supabase.from.mock.calls.filter(([table]: string[]) => table === "macro_plans");
    expect(countCalls).toHaveLength(0);
  });
});
