import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { fetchProgressEntries } from "@/services/progress";
import { buildAnalyticsSnapshot } from "@/services/analytics";

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const entries = await fetchProgressEntries(supabase, userId);
    const snapshot = buildAnalyticsSnapshot(entries);
    return jsonSuccess(snapshot);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to load analytics.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}
