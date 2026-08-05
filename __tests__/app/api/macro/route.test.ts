import { POST } from "@/app/api/macro/route";

describe("macro route POST", () => {
  it("returns 400 for invalid request body", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        body: "not-json"
      })
    );
    const body = await response.json();
    expect(response.status).toBe(400);
  });

  it("returns 400 when request body is not an object", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([])
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when goal is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: 70, bodyFatPercent: 15, activityLevel: "moderate" })
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when activityLevel is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: 70, bodyFatPercent: 15, goal: "maintain" })
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when goal is invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: 70, bodyFatPercent: 15, goal: "unknown", activityLevel: "moderate" })
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 with macro targets for valid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: 72,
          bodyFatPercent: 18,
          goal: "maintain",
          activityLevel: "moderate"
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.method).toBeDefined();
    expect(body.data.assumptions).toBeDefined();
    expect(body.data.targetCalories).toBeDefined();
    expect(body.data.targetCalories.recommended).toBeGreaterThan(0);
    expect(body.data.targets.calories).toBeGreaterThan(0);
    expect(body.data.targets.proteinGrams).toBeGreaterThan(0);
    expect(body.data.targets.fatGrams).toBeGreaterThan(0);
    expect(body.data.targets.carbsGrams).toBeGreaterThan(0);
  });

  it("returns 200 without bodyFatPercent (Mifflin-St Jeor fallback)", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: 72,
          goal: "maintain",
          activityLevel: "moderate"
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.method).toBe("mifflin-st-jeor");
    expect(body.data.confidence).toBe("medium");
    expect(body.data.warnings.length).toBeGreaterThan(0);
  });

  it("applies cut calorie adjustment", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: 72,
          bodyFatPercent: 18,
          goal: "cut",
          activityLevel: "moderate"
        })
      })
    );
    const body = await response.json();
    expect(body.data.targets.calories).toBeLessThan(2550);
  });

  it("applies bulk calorie adjustment", async () => {
    const response = await POST(
      new Request("http://localhost/api/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: 72,
          bodyFatPercent: 18,
          goal: "bulk",
          activityLevel: "moderate"
        })
      })
    );
    const body = await response.json();
    expect(body.data.targets.calories).toBeGreaterThan(2550);
  });
});
