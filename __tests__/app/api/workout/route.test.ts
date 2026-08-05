import { POST } from "@/app/api/workout/route";

describe("workout route POST", () => {
  it("returns 400 for non-object body", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify("invalid")
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when goal is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysPerWeek: 4,
          experienceLevel: "intermediate",
          equipment: "dumbbells",
          sessionMinutes: 60
        })
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when equipment is invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "bulk",
          daysPerWeek: 4,
          experienceLevel: "intermediate",
          equipment: "nonexistent",
          sessionMinutes: 60
        })
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when daysPerWeek is negative", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "cut",
          daysPerWeek: -1,
          experienceLevel: "beginner",
          equipment: "bodyweight",
          sessionMinutes: 45
        })
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 with workout plan for valid 'cut' input", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "cut",
          daysPerWeek: 3,
          experienceLevel: "beginner",
          equipment: "bodyweight",
          sessionMinutes: 45
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.splitName).toBeDefined();
    expect(body.data.days).toBeDefined();
    expect(Array.isArray(body.data.days)).toBe(true);
    expect(body.data.days.length).toBeGreaterThan(0);
    expect(body.data.totalExercises).toBeGreaterThan(0);
  });

  it("returns 200 with workout plan for 'bulk' full_gym", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "bulk",
          daysPerWeek: 5,
          experienceLevel: "advanced",
          equipment: "full_gym",
          sessionMinutes: 90
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.splitName).toBeDefined();
    expect(body.data.days).toBeDefined();
    expect(body.data.days.length).toBeGreaterThan(0);
  });

  it("accepts optional seed parameter", async () => {
    const response = await POST(
      new Request("http://localhost/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "maintain",
          daysPerWeek: 4,
          experienceLevel: "intermediate",
          equipment: "dumbbells",
          sessionMinutes: 60,
          seed: "test-seed-123"
        })
      })
    );
    expect(response.status).toBe(200);
  });
});
