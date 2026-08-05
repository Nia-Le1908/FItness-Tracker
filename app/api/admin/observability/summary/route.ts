import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";

function groupCount<T extends { [key: string]: string | number | null }>(items: T[], key: keyof T) {
  const map = new Map<string, number>();
  for (const item of items) {
    const value = String(item[key] ?? "unknown");
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

function parseDay(value: string) {
  return value.slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const url = new URL(request.url);

    const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const from = url.searchParams.get("from") ?? defaultFrom;
    const to = url.searchParams.get("to") ?? undefined;

    let query = supabase
      .from("observability_events")
      .select("event_type,route,severity,session_id,duration_ms,created_at")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (to) query = query.lte("created_at", to);

    const { data } = await query;
    const events = data ?? [];
    const pageViews = events.filter((event) => event.event_type === "page_view");
    const errors = events.filter((event) => event.event_type === "runtime_error" || event.event_type === "api_error");
    const actions = events.filter((event) => event.event_type === "action");
    const performance = events.filter((event) => event.event_type === "performance");

    const totalByRoute = groupCount(events, "route").sort((a, b) => b.count - a.count).slice(0, 10);
    const routeErrorRates = totalByRoute.map((routeStat) => {
      const routeEvents = events.filter((event) => event.route === routeStat.name);
      const routeErrors = routeEvents.filter((event) => event.event_type === "runtime_error" || event.event_type === "api_error").length;
      return {
        route: routeStat.name,
        total: routeEvents.length,
        errors: routeErrors,
        errorRate: routeEvents.length === 0 ? 0 : Math.round((routeErrors / routeEvents.length) * 100)
      };
    });

    const eventsByDayMap = new Map<string, { page_views: number; errors: number; actions: number }>();
    for (const event of events) {
      const day = parseDay(event.created_at);
      const current = eventsByDayMap.get(day) ?? { page_views: 0, errors: 0, actions: 0 };
      if (event.event_type === "page_view") current.page_views += 1;
      if (event.event_type === "runtime_error" || event.event_type === "api_error") current.errors += 1;
      if (event.event_type === "action") current.actions += 1;
      eventsByDayMap.set(day, current);
    }

    const eventsByDay = Array.from(eventsByDayMap.entries())
      .map(([day, value]) => ({ day, ...value }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const sessionsMap = new Map<string, { page_views: number; errors: number; actions: number; routes: Set<string> }>();
    for (const event of events) {
      const sessionId = event.session_id ?? "unknown";
      const current = sessionsMap.get(sessionId) ?? { page_views: 0, errors: 0, actions: 0, routes: new Set<string>() };
      if (event.event_type === "page_view") current.page_views += 1;
      if (event.event_type === "runtime_error" || event.event_type === "api_error") current.errors += 1;
      if (event.event_type === "action") current.actions += 1;
      current.routes.add(event.route);
      sessionsMap.set(sessionId, current);
    }

    const sessions = Array.from(sessionsMap.entries()).map(([sessionId, value]) => ({
      sessionId,
      pageViews: value.page_views,
      errors: value.errors,
      actions: value.actions,
      routes: Array.from(value.routes)
    }));

    const slowRoutes = performance
      .reduce((acc, event) => {
        const route = event.route;
        const current = acc.get(route) ?? { route, samples: 0, avgDurationMs: 0 };
        const duration = Number(event.duration_ms ?? 0);
        current.samples += 1;
        current.avgDurationMs = Math.round(((current.avgDurationMs * (current.samples - 1)) + duration) / current.samples);
        acc.set(route, current);
        return acc;
      }, new Map<string, { route: string; samples: number; avgDurationMs: number }>())
      .values();

    const slowRoutesList = Array.from(slowRoutes).filter((item) => item.avgDurationMs >= 800).sort((a, b) => b.avgDurationMs - a.avgDurationMs);

    const errorSpike = eventsByDay
      .map((entry) => entry.errors)
      .slice(-7)
      .reduce((sum, item) => sum + item, 0);

    return jsonSuccess({
      topRoutes: totalByRoute,
      routeErrorRates,
      eventsByDay,
      sessions,
      slowRoutes: slowRoutesList,
      alerts: errorSpike >= 10 ? [{ type: "error_spike", severity: "warning", message: "Error volume exceeded threshold over the last 7 days." }] : [],
      totals: {
        pageViews: pageViews.length,
        errors: errors.length,
        actions: actions.length,
        performance: performance.length,
        sessions: sessions.length
      }
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to load observability summary.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
