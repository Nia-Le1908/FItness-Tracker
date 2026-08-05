import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { assertRequestBody, clampString, isAllowedValue } from "@/lib/api/validation";

function normalizeCadence(value: unknown) {
  return isAllowedValue(value, ["weekly", "monthly", "event"] as const) ? value : null;
}

function normalizeChannel(value: unknown) {
  return isAllowedValue(value, ["in_app", "email", "push"] as const) ? value : null;
}

function normalizeGoal(value: unknown) {
  return isAllowedValue(value, ["cut", "maintain", "bulk"] as const) ? value : null;
}

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const { data } = await supabase
      .from("goal_reminders")
      .select("id,user_id,goal,title,message,cadence,channel,is_enabled,last_sent_at,next_send_at,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return jsonSuccess({ reminders: data ?? [] });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to load goal reminders.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = await request.json();
    assertRequestBody(body);

    const goal = normalizeGoal(body.goal);
    const cadence = normalizeCadence(body.cadence);
    const channel = normalizeChannel(body.channel);
    const title = clampString(body.title, "title");
    const message = clampString(body.message, "message");

    if (!goal || !cadence || !channel || !title || !message) {
      return handleApiError(new Error("Invalid reminder request."), "Invalid reminder request.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
    }

    const reminder = {
      user_id: userId,
      goal,
      title,
      message,
      cadence,
      channel,
      is_enabled: body.isEnabled !== false,
      next_send_at: typeof body.nextSendAt === "string" && body.nextSendAt.trim() ? body.nextSendAt.trim() : null
    };

    const { data, error } = await supabase.from("goal_reminders").insert(reminder).select().single();
    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ reminder: data }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to create goal reminder.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
  }
}
