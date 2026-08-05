"use client";

import Link from "next/link";

import type { ActivityLevel, Goal } from "@/types";
import type { MacroCalculatorFormState } from "./use-macro-calculator-panel";

const goals: Goal[] = ["cut", "maintain", "bulk"];
const activityLevels: ActivityLevel[] = ["sedentary", "light", "moderate", "active"];

export function MacroCalculatorForm({
  form,
  inputClass,
  loading,
  onSubmit,
  onFieldChange,
  mealPlannerHref,
  workoutPlannerHref,
  onCreateCustomTarget
}: {
  form: MacroCalculatorFormState;
  inputClass: string;
  loading: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onFieldChange: <K extends keyof MacroCalculatorFormState>(field: K, value: MacroCalculatorFormState[K]) => void;
  mealPlannerHref: string;
  workoutPlannerHref: string;
  onCreateCustomTarget: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Cân nặng / Weight (kg)">
        <input value={form.weightKg} onChange={(event) => onFieldChange("weightKg", event.target.value)} type="number" step="0.1" min="0" className={inputClass} />
      </Field>
      <Field label="Body fat / % mỡ cơ thể">
        <input value={form.bodyFatPercent} onChange={(event) => onFieldChange("bodyFatPercent", event.target.value)} type="number" step="0.1" min="0" max="100" className={inputClass} />
      </Field>
      <Field label="Mục tiêu / Goal">
        <select value={form.goal} onChange={(event) => onFieldChange("goal", event.target.value as Goal)} className={inputClass}>
          {goals.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mức hoạt động / Activity level">
        <select value={form.activityLevel} onChange={(event) => onFieldChange("activityLevel", event.target.value as ActivityLevel)} className={inputClass}>
          {activityLevels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={loading} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {loading ? "Đang tính... / Calculating..." : "Tính macro / Calculate macros"}
        </button>
        <Link href={mealPlannerHref} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
          Gửi sang meal planner / Send to meal planner
        </Link>
        <Link href={workoutPlannerHref} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
          Gửi sang workout planner / Send to workout planner
        </Link>
        <button type="button" onClick={onCreateCustomTarget} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
          Tạo mục tiêu tuỳ chỉnh / Create custom target
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
