import { requireAuth } from "@/lib/api/auth-guard";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber } from "@/lib/api/validation";
import { createProgressEntry, fetchProgressEntries } from "@/services/progress";

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const entries = await fetchProgressEntries(supabase, userId);
    return jsonSuccess({ entries });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized." ? error.message : "Unable to load progress entries.";
    return jsonError(message, error instanceof Error && error.message === "Unauthorized." ? 401 : 500, error instanceof Error && error.message === "Unauthorized." ? "UNAUTHORIZED" : "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = parseJsonBody(await request.json());
    const weightKg = requireNumber(body.weightKg, "weightKg");
    const recordedAt = typeof body.recordedAt === "string" && body.recordedAt.trim().length > 0
      ? body.recordedAt.trim()
      : new Date().toISOString();

    await createProgressEntry(supabase, userId, { recordedAt, weightKg });
    const entries = await fetchProgressEntries(supabase, userId);

    return jsonSuccess({ entries }, 201);
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "Unauthorized.";
    return jsonError(
      isUnauthorized ? error.message : error instanceof Error ? error.message : "Unable to save progress entry.",
      isUnauthorized ? 401 : 400,
      isUnauthorized ? "UNAUTHORIZED" : "BAD_REQUEST"
    );
  }
}