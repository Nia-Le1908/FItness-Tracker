import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { assertRequestBody, toOptionalPositiveNumber } from "@/lib/api/validation";
import { apiDefaults } from "@/lib/constants";
import { createProgressEntry, fetchProgressEntries } from "@/services/progress";

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const entries = await fetchProgressEntries(supabase, userId);
    return jsonSuccess({ entries });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to load progress entries.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = await request.json();
    assertRequestBody(body);
    const weightKg = toOptionalPositiveNumber(body.weightKg);
    if (weightKg === null) {
      return handleApiError(new Error("weightKg is required."), "weightKg is required.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }
    const recordedAt = typeof body.recordedAt === "string" && body.recordedAt.trim().length > 0
      ? body.recordedAt.trim()
      : new Date().toISOString();

    await createProgressEntry(supabase, userId, { recordedAt, weightKg });
    const entries = await fetchProgressEntries(supabase, userId);

    return jsonSuccess({ entries }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to save progress entry.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
