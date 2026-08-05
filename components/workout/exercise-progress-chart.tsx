"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUpIcon } from "@/components/icons";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

interface ChartPoint {
  date: string;
  maxWeight: number;
  totalReps: number;
}

interface Props {
  exerciseName: string;
  chartData: ChartPoint[];
  loading: boolean;
  error: string | null;
  signedIn: boolean;
}

export function ExerciseProgressChart({ exerciseName, chartData, loading, error, signedIn }: Props) {
  const chartColors = useChartTheme();
  const { language } = useLanguage();
  const w = strings.workout;

  return (
    <div className="mt-6 rounded-3xl border border-border bg-background/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">
            <TrendingUpIcon className="mr-1.5 inline size-4 text-primary" />
            {t(w.progressTitle, language)} {exerciseName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(w.progressHint, language)}</p>
        </div>
        {loading ? (
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading</span>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <div className="mt-5 h-64">
        {!signedIn ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            {t(w.signInProgress, language)}
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.border} vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartColors.mutedForeground, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartColors.mutedForeground, fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: chartColors.card,
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: 16,
                  color: chartColors.cardForeground
                }}
              />
              <Line type="monotone" dataKey="maxWeight" stroke={chartColors.primary} strokeWidth={3} dot={{ r: 4, fill: chartColors.card }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            {t(w.logSetsPrompt, language)}
          </div>
        )}
      </div>
    </div>
  );
}

export type { ChartPoint };
