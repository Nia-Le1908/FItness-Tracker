import { NextResponse } from "next/server";

/**
 * Stable error code surface that clients can switch on. Order is by category.
 *
 * - VALIDATION_ERROR : 400 — request body failed schema/format validation
 * - BAD_REQUEST      : 400 — generic 400 (malformed/missing fields, bad query)
 * - UNAUTHORIZED     : 401 — missing or invalid auth credentials
 * - FORBIDDEN        : 403 — authenticated but not authorized for this resource
 * - NOT_FOUND        : 404 — target resource not found
 * - CONFIG_ERROR     : 500 — server-side misconfiguration (missing key, etc.)
 * - INTERNAL_ERROR   : 500 — unexpected runtime error
 *
 * Note: HTTP status numbers come from `apiDefaults` / inline `status` ints in
 * `handleApiError`. The code is a semantic label the client compares against.
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFIG_ERROR"
  | "INTERNAL_ERROR";

export function jsonError(message: string, status: number, code: ApiErrorCode) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
