"use client";

import { useMemo } from "react";
import type { WorkoutSetLog } from "@/types";
import { getMuscleGroup, type MuscleGroup, muscleGroupLabels } from "@/lib/workout/muscle-groups";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { TrendingUpIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

interface Props {
  logs: WorkoutSetLog[];
}

export function VolumeSummary({ logs }: Props) {
  const chartColors = useChartTheme();
  const { language } = useLanguage();
  const w = strings.workout;

  const volumeByGroup = useMemo(() => {
    const map = new Map<MuscleGroup, number>();
    for (const log of logs) {
      const group = getMuscleGroup(log.exerciseName);
      map.set(group, (map.get(group) ?? 0) + log.reps * log.weightKg);
    }
    return map;
  }, [logs]);

  const weeklyVolumeData = useMemo(() => {
    const daily = new Map<string, Map<MuscleGroup, number>>();
    for (const log of logs) {
      const dailyMap = daily.get(log.workoutDate) ?? new Map<MuscleGroup, number>();
      const group = getMuscleGroup(log.exerciseName);
      dailyMap.set(group, (dailyMap.get(group) ?? 0) + log.reps * log.weightKg);
      daily.set(log.workoutDate, dailyMap);
    }
    return Array.from(daily.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, groupMap]) => {
        const entry: Record<string, string | number> = { date };
        for (const [group, vol] of groupMap) {
          entry[group] = Math.round(vol * 10) / 10;
        }
        return entry;
      });
  }, [logs]);

  const streak = useMemo(() => {
    const dates = Array.from(new Set(logs.map((l) => l.workoutDate))).sort().reverse();
    if (!dates.length) return 0;
    let count = 1;
    const oneDay = 86400000;
    for (let i = 1; i < dates.length; i++) {
      const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime();
      if (diff <= oneDay + oneDay / 2) count++;
      else break;
    }
    return count;
  }, [logs]);

  const groups = [...new Set(logs.map((l) => getMuscleGroup(l.exerciseName)))];
  const groupColors: Record<MuscleGroup, string> = {
    chest: "#ef4444",
    back: "#3b82f6",
    legs: "#22c55e",
    shoulders: "#f59e0b",
    arms: "#a855f7",
    core: "#ec4899"
  };

  return (
    <div className="mt-6 rounded-3xl border border-border bg-background/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">
            <TrendingUpIcon className="mr-1.5 inline size-4 text-primary" />
            {t(w.volumeTitle, language)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {logs.length > 0
              ? `${logs.length} sets — ${t(w.streak, language)}: ${streak} ${streak === 1 ? (language === "vi" ? "ngày" : "day") : (language === "vi" ? "ngày" : "days")}`
              : t(w.logSetsPrompt, language)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group} className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{muscleGroupLabels[group][language]}</span>
            <p className="mt-0.5 text-sm font-semibold text-card-foreground">
              {(volumeByGroup.get(group) ?? 0).toLocaleString()} kg
            </p>
          </div>
        ))}
      </div>

      {weeklyVolumeData.length > 1 ? (
        <div className="mt-5 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyVolumeData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.border} vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartColors.mutedForeground, fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartColors.mutedForeground, fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: chartColors.card,
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: 16,
                  color: chartColors.cardForeground
                }}
              />
              {groups.map((group) => (
                <Line
                  key={group}
                  type="monotone"
                  dataKey={group}
                  stroke={groupColors[group]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name={muscleGroupLabels[group][language]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
