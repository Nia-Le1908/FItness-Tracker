"use client";

import type { WorkoutPlan } from "@/types";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

interface Props {
  plan: WorkoutPlan;
  selectedDay: string | null;
  isEditing: boolean;
  onSelectDay: (dayName: string) => void;
  onAddDay: () => void;
}

export function DayList({ plan, selectedDay, isEditing, onSelectDay, onAddDay }: Props) {
  const { language } = useLanguage();
  const w = strings.workout;

  return (
    <aside className="rounded-2xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t(w.daysSidebar, language)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t(w.daysSidebarHint, language)}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{plan.days.length} days</span>
      </div>
      <div className="mt-3 space-y-2">
        {plan.days.map((day) => (
          <button
            key={day.name}
            type="button"
            onClick={() => onSelectDay(day.name)}
            className={
              selectedDay === day.name
                ? "w-full rounded-xl border border-primary bg-primary/10 px-3 py-3 text-left text-sm font-semibold text-primary"
                : "w-full rounded-xl border border-border bg-card px-3 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{day.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em]">{day.focus.replace("_", " ")}</p>
              </div>
              <span className="rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{day.exercises.length} ex</span>
            </div>
          </button>
        ))}
      </div>
      {isEditing ? (
        <button type="button" onClick={onAddDay} className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
          {t(w.addDay, language)}
        </button>
      ) : null}
    </aside>
  );
}
