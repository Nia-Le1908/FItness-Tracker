import { summarizeProgress } from "@/services/progress-tracker";

describe("summarizeProgress", () => {
  it("returns null for fewer than two entries", () => {
    expect(summarizeProgress([])).toBeNull();
    expect(summarizeProgress([{ date: "2026-01-01T00:00:00.000Z", weightKg: 70 }])).toBeNull();
  });

  it("summarizes change between the first and latest entry", () => {
    const summary = summarizeProgress([
      { date: "2026-01-01T00:00:00.000Z", weightKg: 70 },
      { date: "2026-02-01T00:00:00.000Z", weightKg: 68.4 },
      { date: "2026-03-01T00:00:00.000Z", weightKg: 69.1 }
    ]);

    expect(summary).toEqual({
      startWeightKg: 70,
      currentWeightKg: 69.1,
      changeKg: -0.9,
      percentChange: -1.3
    });
  });

  it("supports weight gain", () => {
    const summary = summarizeProgress([
      { date: "2026-01-01T00:00:00.000Z", weightKg: 70 },
      { date: "2026-02-01T00:00:00.000Z", weightKg: 72.2 }
    ]);

    expect(summary?.changeKg).toBe(2.2);
    expect(summary?.percentChange).toBe(3.1);
  });
});
