import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { buildGoalReminderTemplate } from "@/services/notifications";

function normalizeGoal(value: unknown) {
  return value === "cut" || value === "bulk" ? value : "maintain";
}

export async function PUT(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = await request.json();
    const goal = normalizeGoal(body.goal);
    const { data: current } = await supabase.from("users").select("goal").eq("id", userId).single();

    await supabase.from("users").upsert({ id: userId, goal }, { onConflict: "id" });

    const changed = current?.goal !== goal;
    let reminder = null;

    if (changed) {
      const template = buildGoalReminderTemplate(goal);
      const { data } = await supabase
        .from("goal_reminders")
        .insert({
          user_id: userId,
          goal,
          title: template.title,
          message: template.message,
          cadence: template.cadence,
          channel: body.channel === "email" || body.channel === "push" ? body.channel : "in_app",
          is_enabled: true,
          next_send_at: new Date().toISOString()
        })
        .select()
        .single();
      reminder = data;
    }

    return jsonSuccess({ goal, changed, reminder });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to update goal.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
