export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Maximum string lengths for user-input fields (anti-DoS / anti-proto-pollution).
 * Values longer than these are rejected at the API boundary.
 */
export const STRING_LIMITS = {
  name: 100,
  email: 254,
  title: 200,
  description: 2000,
  notes: 5000,
  message: 5000,
  route: 256,
  component: 128,
  planName: 200,
  mealName: 100,
  templateKey: 64
} as const;

export type StringLimitKey = keyof typeof STRING_LIMITS;

/**
 * Type guard: narrows `value` to `string` if it is a non-empty (after trim)
 * string. The `value is string` return annotation lets TS narrow the input
 * after the guard, so callers can safely use `.trim()`, `.toLowerCase()`, etc.
 * without an explicit cast.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function toOptionalPositiveInteger(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

export function toOptionalPositiveNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export function isAllowedValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

export function assertRequestBody(body: unknown): asserts body is Record<string, unknown> {
  if (!isRecord(body)) {
    throw new Error("Invalid request body.");
  }
}

/**
 * Validates that `body` is a non-null object and returns it narrowed as
 * `Record<string, unknown>`. Throws a descriptive error if the input is
 * not a valid JSON object payload.
 *
 * Used by route handlers that need a strict parsing step right after
 * `await request.json()`.
 */
export function parseJsonBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new Error("Invalid request body: expected a JSON object.");
  }
  return body;
}

/**
 * Asserts that `value` is a non-empty trimmed string, optionally with a
 * maximum length. Throws with the provided `field` name for a friendly
 * client error.
 *
 * Usage:
 *   requireString(body.name, "name")           // no length check
 *   requireString(body.name, "name", 100)      // max 100 chars
 *   requireString(body.name, "name", "name")   // uses STRING_LIMITS.name
 */
export function requireString(value: unknown, field: string, maxLength?: number | StringLimitKey): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`'${field}' is required and must be a non-empty string.`);
  }
  const trimmed = value.trim();
  const limit = typeof maxLength === "string" ? STRING_LIMITS[maxLength] : maxLength;
  if (limit !== undefined && trimmed.length > limit) {
    throw new Error(`'${field}' must not exceed ${limit} characters.`);
  }
  return trimmed;
}

/**
 * Returns a trimmed string clamped to the optional maxLength, or an empty
 * string if the input is not a string. Use for optional text fields where
 * truncation is acceptable.
 */
export function clampString(value: unknown, maxLength: number | StringLimitKey): string {
  if (typeof value !== "string") return "";
  const limit = typeof maxLength === "string" ? STRING_LIMITS[maxLength] : maxLength;
  return value.trim().slice(0, limit);
}

/**
 * Asserts that `value` is a finite number. Throws with the provided `field`
 * name in the message for a friendly client error. Accepts numbers or numeric
 * strings (e.g. `setNumber: "5"` from JSON form POSTs).
 */
export function requireNumber(value: unknown, field: string): number {
  const coerced = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(coerced)) {
    throw new Error(`'${field}' is required and must be a finite number.`);
  }
  return coerced;
}

/**
 * Asserts that `value` is a finite POSITIVE number (> 0). Throws with the
 * provided `field` name in the message for a friendly client error. Use this
 * for required inputs like `caloriesPer100g`, `weightKg`, `budgetVnd` that
 * must be a real positive quantity — never returns null.
 *
 * For optional fields where the absence is allowed, use
 * `toOptionalPositiveNumber` instead.
 */
export function requirePositiveNumber(value: unknown, field: string): number {
  const coerced = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(coerced) || coerced <= 0) {
    throw new Error(`'${field}' is required and must be a positive number.`);
  }
  return coerced;
}

/**
 * Like requirePositiveNumber but accepts 0 as well (>= 0). Use for food macro
 * fields where a value of zero is legitimate (e.g. chicken breast has 0 g
 * carbs). Returns the coerced finite number.
 */
export function requireNonNegativeNumber(value: unknown, field: string): number {
  const coerced = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(coerced) || coerced < 0) {
    throw new Error(`'${field}' is required and must be a non-negative number.`);
  }
  return coerced;
}
