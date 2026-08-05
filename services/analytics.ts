 import type { WeightEntry } from "@/types";
import type { WorkoutGoal } from "@/types";

export type AnalyticsTrendPoint = {
  date: string;
  weightKg: number;
  movingAverageKg: number;
  targetBandMinKg: number;
  targetBandMaxKg: number;
};

export type AnalyticsInsight = {
  title: string;
  description: string;
  tone: "success" | "warning" | "info";
};

export type AnalyticsMetric = {
  label: string;
  value: string;
  tone: "success" | "warning" | "info";
};

export type AnalyticsGoalMilestone = {
  label: string;
  targetDate: string;
  targetWeightKg: number;
  progressPercent: number;
  status: "ahead" | "on_track" | "behind";
};

export type AnalyticsNudge = {
  title: string;
  description: string;
  tone: "success" | "warning" | "info";
};

export type AnalyticsSnapshot = {
  entries: WeightEntry[];
  trend: AnalyticsTrendPoint[];
  insights: AnalyticsInsight[];
  metrics: AnalyticsMetric[];
  milestones: AnalyticsGoalMilestone[];
  nudges: AnalyticsNudge[];
  streakDays: number;
  weeklyChangeKg: number | null;
  monthlyChangeKg: number | null;
  weeklyAdherencePercent: number | null;
  monthlyAdherencePercent: number | null;
  projectedWeightKg: number | null;
  targetWeightKg: number | null;
  goalDirection: "cut" | "maintain" | "bulk";
};

function inferGoalDirection(entries: WeightEntry[]): "cut" | "maintain" | "bulk" {
  if (entries.length < 2) return "maintain";
  const first = entries[0].weightKg;
  const last = entries[entries.length - 1].weightKg;
  const change = last - first;
  if (change <= -0.8) return "cut";
  if (change >= 0.8) return "bulk";
  return "maintain";
}

function getGoalTargetDelta(goal: WorkoutGoal | "maintain"): number {
  if (goal === "cut") return -0.5;
  if (goal === "bulk") return 0.4;
  return 0;
}

function calculateAdherencePercent(goal: "cut" | "maintain" | "bulk", weeklyChangeKg: number | null) {
  if (weeklyChangeKg === null) return null;

  const ideal = goal === "cut" ? -0.4 : goal === "bulk" ? 0.25 : 0;
  const variance = Math.abs(weeklyChangeKg - ideal);
  const score = Math.max(0, Math.min(100, 100 - variance * 120));
  return Math.round(score);
}

function formatSigned(value: number | null) {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} kg`;
}

function getStreakDays(entries: WeightEntry[]) {
  if (entries.length === 0) return 0;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let streak = 1;

  for (let index = sorted.length - 1; index > 0; index -= 1) {
    const current = new Date(sorted[index].date);
    const previous = new Date(sorted[index - 1].date);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getProgressPercent(current: number, target: number, start: number) {
  if (start === target) return 100;
  const total = Math.abs(target - start);
  const done = Math.abs(current - start);
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export function buildMovingAverage(values: number[], windowSize = 3) {
  return values.map((value, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    const sum = slice.reduce((total, item) => total + item, 0);
    return Math.round((sum / slice.length) * 10) / 10;
  });
}

export function buildAnalyticsSnapshot(entries: WeightEntry[], goalOverride?: WorkoutGoal | "maintain") {
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const weights = sortedEntries.map((entry) => entry.weightKg);
  const movingAverage = buildMovingAverage(weights);
  const goalDirection = goalOverride ?? inferGoalDirection(sortedEntries);
  const targetDelta = getGoalTargetDelta(goalDirection);

  const trend = sortedEntries.map((entry, index) => {
    const baseline = movingAverage[index] ?? entry.weightKg;
    return {
      date: entry.date,
      weightKg: entry.weightKg,
      movingAverageKg: baseline,
      targetBandMinKg: Math.round((baseline + targetDelta - 0.5) * 10) / 10,
      targetBandMaxKg: Math.round((baseline + targetDelta + 0.5) * 10) / 10
    };
  });

  const first = sortedEntries[0];
  const last = sortedEntries[sortedEntries.length - 1];
  const weeklyChangeKg = sortedEntries.length >= 2 ? Math.round((last.weightKg - first.weightKg) * 10) / 10 : null;
  const monthlyChangeKg = sortedEntries.length >= 4 ? Math.round((last.weightKg - sortedEntries[Math.max(0, sortedEntries.length - 4)].weightKg) * 10) / 10 : weeklyChangeKg;
  const projectedWeightKg = last ? Math.round((last.weightKg + (weeklyChangeKg ?? 0)) * 10) / 10 : null;
  const targetWeightKg = last ? Math.round((last.weightKg + targetDelta * 4) * 10) / 10 : null;
  const weeklyAdherencePercent = calculateAdherencePercent(goalDirection, weeklyChangeKg);
  const monthlyAdherencePercent = calculateAdherencePercent(goalDirection, monthlyChangeKg);
  const streakDays = getStreakDays(sortedEntries);

  const milestones: AnalyticsGoalMilestone[] =
    last && targetWeightKg !== null
      ? [
          {
            label: "Next checkpoint",
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            targetWeightKg: Math.round((last.weightKg + targetDelta) * 10) / 10,
            progressPercent: getProgressPercent(last.weightKg, Math.round((last.weightKg + targetDelta * 4) * 10) / 10, first.weightKg),
            status: weeklyAdherencePercent !== null && weeklyAdherencePercent >= 80 ? "on_track" : weeklyAdherencePercent !== null && weeklyAdherencePercent < 60 ? "behind" : "ahead"
          },
          {
            label: "Monthly goal",
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            targetWeightKg,
            progressPercent: getProgressPercent(last.weightKg, targetWeightKg, first.weightKg),
            status: monthlyAdherencePercent !== null && monthlyAdherencePercent >= 80 ? "on_track" : monthlyAdherencePercent !== null && monthlyAdherencePercent < 60 ? "behind" : "ahead"
          }
        ]
      : [];

  const insights: AnalyticsInsight[] = [];
  if (weeklyChangeKg !== null) {
    insights.push({
      title: goalDirection === "cut" ? "Cutting phase detected" : goalDirection === "bulk" ? "Bulking phase detected" : "Maintenance phase detected",
      description:
        goalDirection === "cut"
          ? "Your weight trend suggests a cut. Keep the trend in the target band to avoid losing too fast."
          : goalDirection === "bulk"
            ? "Your weight trend suggests a bulk. Stay within the target band to limit excess gain."
            : "Your weight trend is stable. Small fluctuations are normal inside the maintenance band.",
      tone: goalDirection === "maintain" ? "warning" : "success"
    });
  }

  if (sortedEntries.length >= 4) {
    insights.push({
      title: "Tracking cadence looks good",
      description: "You have enough data to estimate short-term movement with a moving average.",
      tone: "success"
    });
  }

  if (projectedWeightKg !== null && targetWeightKg !== null) {
    insights.push({
      title: "Projection vs target",
      description:
        projectedWeightKg > targetWeightKg
          ? "Projected weight is above target; tighten calories or increase activity slightly."
          : projectedWeightKg < targetWeightKg
            ? "Projected weight is below target; consider easing the deficit or increasing intake."
            : "Projected weight is aligned with target bands.",
      tone: projectedWeightKg > targetWeightKg ? "warning" : "info"
    });
  }

  const nudges: AnalyticsNudge[] = [];
  if (streakDays < 3) {
    nudges.push({ title: "Build a streak", description: "Log your weight for 3 consecutive weeks to improve accuracy.", tone: "warning" });
  } else {
    nudges.push({ title: "Nice streak", description: `${streakDays} weekly check-ins in a row. Keep it going.`, tone: "success" });
  }

  if ((weeklyAdherencePercent ?? 0) < 70) {
    nudges.push({ title: "Tighten adherence", description: "Reduce weekly variance by reviewing calories, steps, and training consistency.", tone: "warning" });
  } else {
    nudges.push({ title: "Adherence is solid", description: "Your current rate is close to the target zone.", tone: "success" });
  }

  if (goalDirection === "cut") {
    nudges.push({ title: "Cut reminder", description: "If hunger spikes, prioritize protein and high-volume foods before adjusting calories.", tone: "info" });
  }

  if (goalDirection === "bulk") {
    nudges.push({ title: "Bulk reminder", description: "Aim for a steady surplus and monitor waist changes alongside scale weight.", tone: "info" });
  }

  const metrics: AnalyticsMetric[] = [
    { label: "Weekly change", value: formatSigned(weeklyChangeKg), tone: weeklyChangeKg !== null && weeklyChangeKg < 0 ? "success" : "info" },
    { label: "Monthly change", value: formatSigned(monthlyChangeKg), tone: monthlyChangeKg !== null && monthlyChangeKg < 0 ? "success" : "info" },
    { label: "Weekly adherence", value: weeklyAdherencePercent === null ? "—" : `${weeklyAdherencePercent}%`, tone: (weeklyAdherencePercent ?? 0) >= 80 ? "success" : "warning" },
    { label: "Monthly adherence", value: monthlyAdherencePercent === null ? "—" : `${monthlyAdherencePercent}%`, tone: (monthlyAdherencePercent ?? 0) >= 80 ? "success" : "warning" },
    { label: "Streak", value: `${streakDays} weeks`, tone: streakDays >= 3 ? "success" : "warning" }
  ];

  return { entries: sortedEntries, trend, insights, metrics, milestones, nudges, streakDays, weeklyChangeKg, monthlyChangeKg, weeklyAdherencePercent, monthlyAdherencePercent, projectedWeightKg, targetWeightKg, goalDirection };
}
