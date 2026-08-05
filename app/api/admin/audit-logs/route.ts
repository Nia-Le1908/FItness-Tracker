import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;
    const action = url.searchParams.get("action")?.trim();

    let query = supabase
      .from("audit_events")
      .select("id,actor_user_id,actor_role,target_type,target_id,action,summary,payload,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq("action", action);
    }

    const { data } = await query;

    return jsonSuccess({ auditLogs: data ?? [] });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to load audit logs.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}