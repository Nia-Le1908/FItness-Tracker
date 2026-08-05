import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const url = new URL(request.url);
    const route = url.searchParams.get("route");
    const severity = url.searchParams.get("severity");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const eventType = url.searchParams.get("eventType");
    const limitParam = Number(url.searchParams.get("limit") ?? 500);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 1000) : 500;

    let query = supabase
      .from("observability_events")
      .select("id,user_id,session_id,event_type,source,route,component,message,severity,payload,duration_ms,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (route) query = query.eq("route", route);
    if (severity) query = query.eq("severity", severity);
    if (eventType) query = query.eq("event_type", eventType);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data } = await query;
    return jsonSuccess({ events: data ?? [] });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to load observability data.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
  }
}
