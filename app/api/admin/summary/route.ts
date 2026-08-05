import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const [{ count: usersCount }, { count: remindersCount }, { count: notificationsCount }, { count: attemptsCount }, { count: errorsCount }, { count: pageViewsCount }] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("goal_reminders").select("id", { count: "exact", head: true }),
      supabase.from("notification_events").select("id", { count: "exact", head: true }),
      supabase.from("payment_attempts").select("id", { count: "exact", head: true }),
      supabase.from("observability_events").select("id", { count: "exact", head: true }).eq("event_type", "runtime_error"),
      supabase.from("observability_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view")
    ]);

    return jsonSuccess({
      users: usersCount ?? 0,
      reminders: remindersCount ?? 0,
      notifications: notificationsCount ?? 0,
      paymentAttempts: attemptsCount ?? 0,
      runtimeErrors: errorsCount ?? 0,
      pageViews: pageViewsCount ?? 0
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to load admin summary.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
