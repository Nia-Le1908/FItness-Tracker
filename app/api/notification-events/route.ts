import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { assertRequestBody, isAllowedValue, isNonEmptyString, isRecord } from "@/lib/api/validation";

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const { data } = await supabase
      .from("notification_events")
      .select("id,user_id,reminder_id,type,title,body,state,payload,scheduled_at,sent_at,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return jsonSuccess({ events: data ?? [] });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to load notifications.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = await request.json();
    assertRequestBody(body);

    const eventType = isAllowedValue(body.type, ["goal_update", "streak", "reminder", "nudges"] as const) ? body.type : null;
    const state = isAllowedValue(body.state, ["queued", "sent", "read", "dismissed", "failed"] as const) ? body.state : null;
    const title = isNonEmptyString(body.title) ? body.title.trim() : "";
    const message = isNonEmptyString(body.body) ? body.body.trim() : "";
    const payload = isRecord(body.payload) ? body.payload : {};

    if (!eventType || !state || !title || !message) {
      return handleApiError(new Error("Invalid notification request."), "Invalid notification request.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
    }

    const event = {
      user_id: userId,
      reminder_id: typeof body.reminderId === "string" && body.reminderId.trim() ? body.reminderId.trim() : null,
      type: eventType,
      title,
      body: message,
      state,
      payload,
      scheduled_at: typeof body.scheduledAt === "string" && body.scheduledAt.trim() ? body.scheduledAt.trim() : null,
      sent_at: typeof body.sentAt === "string" && body.sentAt.trim() ? body.sentAt.trim() : null
    };

    const { data, error } = await supabase.from("notification_events").insert(event).select().single();
    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ event: data }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to create notification event.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
  }
}
