import { NextResponse } from "next/server";

export type ApiErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR";

export function jsonError(message: string, status: number, code: ApiErrorCode) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
