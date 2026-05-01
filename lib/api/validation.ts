export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  return body;
}

export function requireNumber(value: unknown, fieldName: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return parsed;
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

export function requireOneOf<T extends string>(value: unknown, fieldName: string, options: readonly T[]): T {
  const parsed = requireString(value, fieldName) as T;
  if (!options.includes(parsed)) {
    throw new Error(`${fieldName} must be one of: ${options.join(", ")}.`);
  }

  return parsed;
}
