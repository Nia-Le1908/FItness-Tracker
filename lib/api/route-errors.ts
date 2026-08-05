import { jsonError, type ApiErrorCode } from "@/lib/api/http";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized.") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden.") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function handleApiError(error: unknown, fallbackMessage: string, status?: number, code?: ApiErrorCode): Response {
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, error.statusCode, error.code);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, error.statusCode, error.code);
  }
  if (error instanceof AppError) {
    return jsonError(error.message, error.statusCode, error.code);
  }
  if (error instanceof Error) {
    const httpStatus = status ?? 500;
    if (httpStatus >= 500) {
      console.error("[INTERNAL_ERROR]", error);
      return jsonError("An unexpected error occurred.", httpStatus, "INTERNAL_ERROR");
    }
    return jsonError(error.message, httpStatus, code ?? "BAD_REQUEST");
  }

  const httpStatus = status ?? 400;
  return jsonError(fallbackMessage, httpStatus, code ?? "BAD_REQUEST");
}
