import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { assertRequestBody, isAllowedValue, isRecord } from "@/lib/api/validation";
import { normalizeObservabilityInput } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return jsonSuccess({ events: [] });
    }

    const supabase = createSupabaseRouteClient(token);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      return jsonSuccess({ events: [] });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");
    const severity = searchParams.get("severity");
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 250);

    let query = supabase
      .from("observability_events")
      .select("id,user_id,session_id,event_type,source,route,component,message,severity,payload,duration_ms,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) query = query.eq("event_type", eventType);
    if (severity) query = query.eq("severity", severity);

    const { data } = await query;
    return jsonSuccess({ events: data ?? [] });
  } catch (error) {
    return handleApiError(error, "Unable to load observability events.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    assertRequestBody(body);

    // Telemetry ingest accepts anonymous events (user_id may be null), so it
    // must use the server-side service-role client which bypasses the
    // observability_events_insert_own RLS policy. The service key never leaves
    // the server. The user id is still resolved from the bearer token (when
    // present) via the anon route client so we never trust a client-supplied id.
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let userId: string | null = null;
    if (token) {
      const routeClient = createSupabaseRouteClient(token);
      const { data: userData } = await routeClient.auth.getUser();
      userId = userData.user?.id ?? null;
    }
    const supabase = createSupabaseServerClient();

    const normalized = normalizeObservabilityInput({
      eventType: isAllowedValue(body.eventType, ["page_view", "runtime_error", "action", "navigation", "api_error", "performance"] as const) ? body.eventType : "action",
      severity: isAllowedValue(body.severity, ["debug", "info", "warning", "error", "critical"] as const) ? body.severity : "info",
      route: typeof body.route === "string" ? body.route : "/",
      component: typeof body.component === "string" ? body.component : null,
      message: typeof body.message === "string" ? body.message : "event",
      payload: isRecord(body.payload) ? body.payload : {},
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      durationMs: typeof body.durationMs === "number" ? body.durationMs : null
    });

    const { data, error } = await supabase.from("observability_events").insert({
      user_id: userId,
      ...normalized
    }).select().single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ event: data }, apiDefaults.createdStatus);
  } catch (error) {
    return handleApiError(error, "Unable to record observability event.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
