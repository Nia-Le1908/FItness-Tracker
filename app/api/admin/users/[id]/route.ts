import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin, requireFullAdmin } from "@/lib/api/admin-guard";
import { createAuditEvent } from "@/lib/payments/payment-audit";

// Next.js 15: `params` is a Promise and must be awaited.
type RouteParams = { id: string };

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { supabase } = await requireAdmin(request);
    const { id } = await params;
    const [{ data: user }, { data: reminders }, { data: notifications }, { data: attempts }] = await Promise.all([
      supabase.from("users").select("id,full_name,email,role,height_cm,daily_budget_vnd,goal,updated_at").eq("id", id).single(),
      supabase.from("goal_reminders").select("id,goal,title,message,cadence,channel,is_enabled,last_sent_at,next_send_at,created_at,updated_at").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("notification_events").select("id,type,title,body,state,created_at,scheduled_at,sent_at").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("payment_attempts").select("id,provider,plan,order_code,payment_link_id,status,amount_vnd,currency,checkout_url,created_at,updated_at").eq("user_id", id).order("created_at", { ascending: false })
    ]);

    return jsonSuccess({ user, reminders: reminders ?? [], notifications: notifications ?? [], attempts: attempts ?? [] });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to load user.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    const hasRoleField = body.role !== undefined;
    const hasGoalField = body.goal !== undefined;

    if (!hasRoleField && !hasGoalField) {
      return jsonSuccess({ updated: false });
    }

    const guard = hasRoleField
      ? await requireFullAdmin(request)
      : await requireAdmin(request);
    const { supabase, userId: actorId, role: actorRole } = guard;

    if (hasRoleField) {
      if (body.role !== "admin" && body.role !== "moderator" && body.role !== "support") {
        return handleApiError(
          new Error("Invalid role value."),
          "Invalid role.",
          apiDefaults.badRequestStatus,
          "VALIDATION_ERROR"
        );
      }
    }

    if (hasGoalField) {
      if (body.goal !== "cut" && body.goal !== "bulk" && body.goal !== "maintain") {
        return handleApiError(
          new Error("Invalid goal value."),
          "Invalid goal.",
          apiDefaults.badRequestStatus,
          "VALIDATION_ERROR"
        );
      }
    }

    const changes: Record<string, unknown> = {};
    const updatePayload: Record<string, unknown> = {};
    if (hasRoleField) {
      changes.role = body.role;
      updatePayload.role = body.role;
    }
    if (hasGoalField) {
      changes.goal = body.goal;
      updatePayload.goal = body.goal;
    }

    await supabase.from("users").update(updatePayload).eq("id", id);

    await createAuditEvent(supabase, {
      actorUserId: actorId,
      actorRole,
      targetType: "user",
      targetId: id,
      action: "admin_update_user",
      summary: `Admin updated user ${id} → ${Object.keys(changes).join(", ")}`,
      payload: { targetUserId: id, changes }
    });

    return jsonSuccess({ updated: true, ...changes });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to update user.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
