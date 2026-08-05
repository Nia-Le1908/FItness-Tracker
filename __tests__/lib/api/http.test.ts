import { jsonError, jsonSuccess } from "@/lib/api/http";

describe("jsonError", () => {
  it("returns a NextResponse with error payload", async () => {
    const response = jsonError("Invalid input.", 400, "VALIDATION_ERROR");
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toEqual({
      code: "VALIDATION_ERROR",
      message: "Invalid input."
    });
  });

  it("returns 500 for internal errors", async () => {
    const response = jsonError("Server error.", 500, "INTERNAL_ERROR");
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("returns 401 for unauthorized", async () => {
    const response = jsonError("Unauthorized.", 401, "UNAUTHORIZED");
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 for not found", async () => {
    const response = jsonError("Not found.", 404, "NOT_FOUND");
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("jsonSuccess", () => {
  it("returns 200 with data by default", async () => {
    const response = jsonSuccess({ id: "abc" });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { id: "abc" } });
  });

  it("returns custom status code", async () => {
    const response = jsonSuccess({ id: "def" }, 201);
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body).toEqual({ data: { id: "def" } });
  });

  it("handles array data", async () => {
    const response = jsonSuccess([1, 2, 3]);
    const body = await response.json();
    expect(body).toEqual({ data: [1, 2, 3] });
  });

  it("handles null data", async () => {
    const response = jsonSuccess(null);
    const body = await response.json();
    expect(body).toEqual({ data: null });
  });
});
