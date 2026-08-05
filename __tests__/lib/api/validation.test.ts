import { isRecord, toTrimmedString, isNonEmptyString, toOptionalPositiveInteger, toOptionalPositiveNumber, isAllowedValue, assertRequestBody, parseJsonBody, requireString, clampString, requireNumber, requirePositiveNumber, requireNonNegativeNumber, STRING_LIMITS } from "@/lib/api/validation";

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: "value" })).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("toTrimmedString", () => {
  it("trims whitespace from strings", () => {
    expect(toTrimmedString("  hello  ")).toBe("hello");
  });

  it("returns empty string for non-strings", () => {
    expect(toTrimmedString(123)).toBe("");
    expect(toTrimmedString(null)).toBe("");
    expect(toTrimmedString(undefined)).toBe("");
    expect(toTrimmedString({})).toBe("");
  });
});

describe("isNonEmptyString", () => {
  it("returns true for non-empty trimmed strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("  hello  ")).toBe(true);
  });

  it("returns false for empty strings", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
  });

  it("returns false for non-strings", () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
  });
});

describe("toOptionalPositiveInteger", () => {
  it("returns the number for positive integers", () => {
    expect(toOptionalPositiveInteger(5)).toBe(5);
    expect(toOptionalPositiveInteger("10")).toBe(10);
  });

  it("returns null for non-positive values", () => {
    expect(toOptionalPositiveInteger(0)).toBeNull();
    expect(toOptionalPositiveInteger(-1)).toBeNull();
  });

  it("returns null for non-integer values", () => {
    expect(toOptionalPositiveInteger(3.14)).toBeNull();
    expect(toOptionalPositiveInteger("abc")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(toOptionalPositiveInteger(null)).toBeNull();
    expect(toOptionalPositiveInteger(undefined)).toBeNull();
  });
});

describe("toOptionalPositiveNumber", () => {
  it("returns the number for positive values", () => {
    expect(toOptionalPositiveNumber(3.14)).toBe(3.14);
    expect(toOptionalPositiveNumber("1.5")).toBe(1.5);
  });

  it("returns null for zero and negative values", () => {
    expect(toOptionalPositiveNumber(0)).toBeNull();
    expect(toOptionalPositiveNumber(-5)).toBeNull();
  });

  it("returns null for non-numeric values", () => {
    expect(toOptionalPositiveNumber("abc")).toBeNull();
    expect(toOptionalPositiveNumber(null)).toBeNull();
  });
});

describe("isAllowedValue", () => {
  const allowed = ["a", "b", "c"] as const;

  it("returns true for values in the allowed array", () => {
    expect(isAllowedValue("a", allowed)).toBe(true);
    expect(isAllowedValue("b", allowed)).toBe(true);
  });

  it("returns false for values not in the allowed array", () => {
    expect(isAllowedValue("d", allowed)).toBe(false);
    expect(isAllowedValue("", allowed)).toBe(false);
  });

  it("returns false for non-string values", () => {
    expect(isAllowedValue(1, allowed)).toBe(false);
    expect(isAllowedValue(null, allowed)).toBe(false);
  });
});

describe("assertRequestBody", () => {
  it("does not throw for plain objects", () => {
    expect(() => assertRequestBody({ key: "value" })).not.toThrow();
    expect(() => assertRequestBody({})).not.toThrow();
  });

  it("throws for invalid values", () => {
    expect(() => assertRequestBody(null)).toThrow("Invalid request body.");
    expect(() => assertRequestBody([])).toThrow("Invalid request body.");
    expect(() => assertRequestBody("string")).toThrow("Invalid request body.");
  });
});

describe("parseJsonBody", () => {
  it("returns the object for valid input", () => {
    const body = { key: "value" };
    expect(parseJsonBody(body)).toEqual(body);
  });

  it("throws for invalid input", () => {
    expect(() => parseJsonBody(null)).toThrow("expected a JSON object");
    expect(() => parseJsonBody([])).toThrow("expected a JSON object");
  });
});

describe("requireString", () => {
  it("returns trimmed string for valid input", () => {
    expect(requireString("  hello  ", "test")).toBe("hello");
  });

  it("throws for empty strings", () => {
    expect(() => requireString("", "test")).toThrow("'test' is required");
    expect(() => requireString("   ", "test")).toThrow("'test' is required");
  });

  it("throws for non-string values", () => {
    expect(() => requireString(123, "test")).toThrow("'test' is required");
    expect(() => requireString(null, "test")).toThrow("'test' is required");
  });

  it("enforces numeric maxLength", () => {
    expect(() => requireString("hello", "test", 3)).toThrow("must not exceed 3 characters");
    expect(requireString("hi", "test", 3)).toBe("hi");
  });

  it("enforces STRING_LIMITS key", () => {
    expect(() => requireString("a".repeat(101), "name", "name")).toThrow("must not exceed 100");
    expect(requireString("john", "name", "name")).toBe("john");
  });

  it("allows strings with no maxLength", () => {
    const long = "a".repeat(1000);
    expect(requireString(long, "test")).toBe(long);
  });
});

describe("clampString", () => {
  it("returns trimmed string within limit", () => {
    expect(clampString("hello", 10)).toBe("hello");
  });

  it("truncates strings exceeding limit", () => {
    expect(clampString("hello world", 5)).toBe("hello");
  });

  it("returns empty string for non-string input", () => {
    expect(clampString(null, 10)).toBe("");
    expect(clampString(123, 10)).toBe("");
  });

  it("works with STRING_LIMITS keys", () => {
    expect(clampString("a".repeat(200), "name")).toBe("a".repeat(100));
  });
});

describe("requireNumber", () => {
  it("returns the number for valid input", () => {
    expect(requireNumber(42, "test")).toBe(42);
    expect(requireNumber("3.14", "test")).toBe(3.14);
  });

  it("throws for NaN/Infinity", () => {
    expect(() => requireNumber(NaN, "test")).toThrow("must be a finite number");
    expect(() => requireNumber("abc", "test")).toThrow("must be a finite number");
  });
});

describe("requirePositiveNumber", () => {
  it("returns the number for positive values", () => {
    expect(requirePositiveNumber(1, "test")).toBe(1);
    expect(requirePositiveNumber(0.5, "test")).toBe(0.5);
  });

  it("throws for zero and negative values", () => {
    expect(() => requirePositiveNumber(0, "test")).toThrow("must be a positive number");
    expect(() => requirePositiveNumber(-1, "test")).toThrow("must be a positive number");
  });
});

describe("requireNonNegativeNumber", () => {
  it("returns the number for non-negative values", () => {
    expect(requireNonNegativeNumber(0, "test")).toBe(0);
    expect(requireNonNegativeNumber(10, "test")).toBe(10);
  });

  it("throws for negative values", () => {
    expect(() => requireNonNegativeNumber(-1, "test")).toThrow("must be a non-negative number");
  });
});

describe("STRING_LIMITS", () => {
  it("has appropriate values for all keys", () => {
    expect(STRING_LIMITS.name).toBe(100);
    expect(STRING_LIMITS.email).toBe(254);
    expect(STRING_LIMITS.title).toBe(200);
    expect(STRING_LIMITS.description).toBe(2000);
    expect(STRING_LIMITS.notes).toBe(5000);
    expect(STRING_LIMITS.message).toBe(5000);
    expect(STRING_LIMITS.route).toBe(256);
    expect(STRING_LIMITS.component).toBe(128);
    expect(STRING_LIMITS.planName).toBe(200);
    expect(STRING_LIMITS.mealName).toBe(100);
    expect(STRING_LIMITS.templateKey).toBe(64);
  });
});
