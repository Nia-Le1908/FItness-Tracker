import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildGoalReminderTemplate, computeNextSendAt, dispatchNotificationBatch, shouldEscalateReminder } from "@/services/notifications";

function isAuthorizedCron(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  return Boolean(expected) && auth === `Bearer ${expected}`;
}

function buildDedupKey(reminderId: string, sentAt: string) {
  return `${reminderId}:${sentAt.slice(0, 10)}`;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorizedCron(request)) {
      return handleApiError(new Error("Unauthorized."), "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    const supabase = createSupabaseServerClient();
    const { data: reminders } = await supabase
      .from("goal_reminders")
      .select("id,user_id,goal,title,message,cadence,channel,is_enabled,last_sent_at,next_send_at")
      .eq("is_enabled", true);

    const dueReminders = (reminders ?? []).filter((reminder) => shouldEscalateReminder(reminder.next_send_at));
    let sent = 0;
    let skipped = 0;
    let capped = 0;
    const MAX_ITERATIONS = 500;

    for (const reminder of dueReminders) {
      if (sent + skipped >= MAX_ITERATIONS) {
        capped = dueReminders.length - sent - skipped;
        break;
      }
      const template = buildGoalReminderTemplate(reminder.goal as "cut" | "maintain" | "bulk");
      const sendAt = new Date().toISOString();
      const dedupKey = buildDedupKey(reminder.id, sendAt);

      const { data: existing } = await supabase
        .from("notification_events")
        .select("id")
        .eq("reminder_id", reminder.id)
        .eq("state", "sent")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if ((existing ?? []).length > 0) {
        skipped += 1;
        continue;
      }

      const result = await dispatchNotificationBatch({
        userId: reminder.user_id,
        title: reminder.title ?? template.title,
        body: reminder.message ?? template.message,
        channel: reminder.channel as "in_app" | "email" | "push",
        payload: { reminderId: reminder.id, goal: reminder.goal, cadence: reminder.cadence, dedupKey }
      });

      if (result.sent > 0) {
        sent += 1;
        const nextSendAt = computeNextSendAt(reminder.cadence as "weekly" | "monthly" | "event");
        await supabase.from("goal_reminders").update({ last_sent_at: sendAt, next_send_at: nextSendAt }).eq("id", reminder.id);
        await supabase.from("notification_events").insert({
          user_id: reminder.user_id,
          reminder_id: reminder.id,
          type: "reminder",
          title: reminder.title ?? template.title,
          body: reminder.message ?? template.message,
          state: "sent",
          payload: { cron: true, reminderId: reminder.id, goal: reminder.goal, cadence: reminder.cadence, result, dedupKey },
          scheduled_at: sendAt,
          sent_at: sendAt
        });
      }
    }

    return jsonSuccess({ scanned: reminders?.length ?? 0, due: dueReminders.length, sent, skipped, capped });
  } catch (error) {
    return handleApiError(error, "Unable to run notification scheduler.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
