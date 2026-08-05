import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError, AppError, handleApiError, isUnauthorizedError, isForbiddenError, isAppError } from "@/lib/api/route-errors";

describe("AppError base class", () => {
  it("stores statusCode and code", () => {
    const err = new AppError("test", "BAD_REQUEST", 400);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("test");
  });
});

describe("UnauthorizedError", () => {
  it("has status 401 and code UNAUTHORIZED", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err).toBeInstanceOf(AppError);
  });

  it("accepts a custom message", () => {
    const err = new UnauthorizedError("Custom.");
    expect(err.message).toBe("Custom.");
  });
});

describe("ForbiddenError", () => {
  it("has status 403 and code FORBIDDEN", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("ValidationError", () => {
  it("has status 400 and code VALIDATION_ERROR", () => {
    const err = new ValidationError("Field required.");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("NotFoundError", () => {
  it("has status 404 and code NOT_FOUND", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("handleApiError", () => {
  it("auto-classifies UnauthorizedError → 401", async () => {
    const response = handleApiError(new UnauthorizedError("No token."), "Fallback");
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("auto-classifies ForbiddenError → 403", async () => {
    const response = handleApiError(new ForbiddenError("Access denied."), "Fallback");
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("auto-classifies ValidationError → 400", async () => {
    const response = handleApiError(new ValidationError("Invalid field."), "Fallback");
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("auto-classifies NotFoundError → 404", async () => {
    const response = handleApiError(new NotFoundError("User not found."), "Fallback");
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("sanitizes unknown errors when status >= 500", async () => {
    const response = handleApiError(new Error("DB connection failed: xyz"), "Fallback", 500, "INTERNAL_ERROR");
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error.message).toBe("An unexpected error occurred.");
  });

  it("exposes error message for unknown errors when status < 500", async () => {
    const response = handleApiError(new Error("Field required."), "Fallback", 400, "VALIDATION_ERROR");
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Field required.");
  });

  it("uses fallback for non-Error values", async () => {
    const response = handleApiError("unknown", "Custom fallback.", 400, "BAD_REQUEST");
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Custom fallback.");
  });
});

describe("type guards", () => {
  it("isUnauthorizedError detects correctly", () => {
    expect(isUnauthorizedError(new UnauthorizedError())).toBe(true);
    expect(isUnauthorizedError(new ForbiddenError())).toBe(false);
    expect(isUnauthorizedError(new Error("x"))).toBe(false);
  });

  it("isForbiddenError detects correctly", () => {
    expect(isForbiddenError(new ForbiddenError())).toBe(true);
    expect(isForbiddenError(new UnauthorizedError())).toBe(false);
    expect(isForbiddenError(null)).toBe(false);
  });

  it("isAppError detects AppError subclasses", () => {
    expect(isAppError(new UnauthorizedError())).toBe(true);
    expect(isAppError(new ValidationError("x"))).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });
});
