export type NotificationDispatchResult = {
  queued: number;
  sent: number;
  failed: number;
};

export type SchedulerReminder = {
  id: string;
  user_id: string;
  goal: "cut" | "maintain" | "bulk";
  title: string;
  message: string;
  cadence: "weekly" | "monthly" | "event";
  channel: "in_app" | "email" | "push";
  is_enabled: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
};

export async function dispatchNotificationBatch(input: { userId: string; title: string; body: string; channel: "in_app" | "email" | "push"; payload?: Record<string, unknown> }) {
  return {
    queued: 1,
    sent: 1,
    failed: 0,
    channel: input.channel,
    userId: input.userId,
    title: input.title,
    body: input.body,
    payload: input.payload ?? {}
  };
}

export function buildGoalReminderTemplate(goal: "cut" | "maintain" | "bulk") {
  if (goal === "cut") {
    return {
      title: "Cut check-in",
      message: "Log your weight and keep calories aligned with your cut target.",
      cadence: "weekly" as const
    };
  }

  if (goal === "bulk") {
    return {
      title: "Bulk check-in",
      message: "Track scale weight and stay within your surplus band.",
      cadence: "weekly" as const
    };
  }

  return {
    title: "Maintenance check-in",
    message: "Review your weight trend and keep your routine steady.",
    cadence: "monthly" as const
  };
}

export function shouldEscalateReminder(nextSendAt: string | null | undefined) {
  if (!nextSendAt) return true;
  return new Date(nextSendAt).getTime() <= Date.now();
}

export function computeNextSendAt(cadence: "weekly" | "monthly" | "event") {
  const now = Date.now();
  const delta = cadence === "monthly" ? 30 : cadence === "event" ? 7 : 7;
  return new Date(now + delta * 24 * 60 * 60 * 1000).toISOString();
}
