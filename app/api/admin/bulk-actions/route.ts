import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin, requireFullAdmin } from "@/lib/api/admin-guard";
import { createAuditEvent } from "@/lib/payments/payment-audit";

function normalizeNotificationState(value: unknown) {
  return value === "read" || value === "dismissed" || value === "queued" || value === "sent" || value === "failed" ? value : "read";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;
    const rawUserIds = Array.isArray(body.userIds) ? body.userIds.filter((value: unknown): value is string => typeof value === "string") : [];
    const rawNotificationIds = Array.isArray(body.notificationIds) ? body.notificationIds.filter((value: unknown): value is string => typeof value === "string") : [];

    const MAX_BULK_IDS = 200;
    const userIds = rawUserIds.slice(0, MAX_BULK_IDS);
    const notificationIds = rawNotificationIds.slice(0, MAX_BULK_IDS);

    if (action === "update_user_role") {
      const role = body.role === "admin" || body.role === "moderator" || body.role === "support" ? body.role : "user";
      const { supabase, userId: actorId, role: actorRole } = await requireFullAdmin(request);

      await supabase.from("users").update({ role }).in("id", userIds);

      await createAuditEvent(supabase, {
        actorUserId: actorId,
        actorRole,
        targetType: "user",
        targetId: userIds.join(","),
        action: "admin_bulk_update_role",
        summary: `Admin bulk-updated ${userIds.length} users → role ${role}`,
        payload: { count: userIds.length, role, userIds: userIds.slice(0, 50) }
      });

      return jsonSuccess({ action, updated: userIds.length, role });
    }

    if (action === "update_notification_state") {
      const state = normalizeNotificationState(body.state);
      const { supabase, userId: actorId, role: actorRole } = await requireAdmin(request);

      await supabase.from("notification_events").update({ state }).in("id", notificationIds);

      await createAuditEvent(supabase, {
        actorUserId: actorId,
        actorRole,
        targetType: "notification_event",
        targetId: notificationIds.join(","),
        action: "admin_bulk_update_notification",
        summary: `Admin bulk-updated ${notificationIds.length} notifications → ${state}`,
        payload: { count: notificationIds.length, state, ids: notificationIds.slice(0, 50) }
      });

      return jsonSuccess({ action, updated: notificationIds.length, state });
    }

    return handleApiError(new Error("Invalid action."), "Invalid action.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to run bulk action.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
