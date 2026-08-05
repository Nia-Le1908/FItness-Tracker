import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";
import { createAuditEvent } from "@/lib/payments/payment-audit";
import { assertRequestBody, isAllowedValue } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const { supabase, userId: actorId, role: actorRole } = await requireAdmin(request);
    const body = await request.json();
    assertRequestBody(body);
    const action = isAllowedValue(body.action, ["pause_notifications", "resume_notifications"] as const) ? body.action : "pause_notifications";

    if (action === "pause_notifications") {
      const { data, error } = await supabase
        .from("notification_events")
        .update({ state: "dismissed" })
        .in("state", ["queued", "scheduled"])
        .select("id");

      if (error) throw error;

      await createAuditEvent(supabase, {
        actorUserId: actorId,
        actorRole,
        targetType: "notification_event",
        targetId: "bulk",
        action: "admin_pause_notifications",
        summary: `Admin paused ${data?.length ?? 0} notifications`,
        payload: { affected: data?.length ?? 0 }
      });

      return jsonSuccess({ action, affected: data?.length ?? 0, state: "dismissed" });
    }

    const { data, error } = await supabase
      .from("notification_events")
      .update({ state: "queued" })
      .in("state", ["dismissed"])
      .select("id");

    if (error) throw error;

    await createAuditEvent(supabase, {
      actorUserId: actorId,
      actorRole,
      targetType: "notification_event",
      targetId: "bulk",
      action: "admin_resume_notifications",
      summary: `Admin resumed ${data?.length ?? 0} notifications`,
      payload: { affected: data?.length ?? 0 }
    });

    return jsonSuccess({ action, affected: data?.length ?? 0, state: "queued" });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to run system control.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}