"use client";

import type { WorkoutEquipment, WorkoutGoal } from "@/types";
import { DumbbellIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

const goals: WorkoutGoal[] = ["cut", "maintain", "bulk"];
const experienceLevels = ["beginner", "intermediate", "advanced"];
const equipmentOptions: WorkoutEquipment[] = ["bodyweight", "dumbbells", "full_gym"];

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary";

interface Props {
  goal: WorkoutGoal;
  daysPerWeek: string;
  experienceLevel: string;
  equipment: WorkoutEquipment;
  sessionMinutes: string;
  seed: string;
  loading: boolean;
  onGoalChange: (value: WorkoutGoal) => void;
  onDaysChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  onEquipmentChange: (value: WorkoutEquipment) => void;
  onSessionMinutesChange: (value: string) => void;
  onSeedChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStartCustom: () => void;
}

export function PlannerForm({
  goal,
  daysPerWeek,
  experienceLevel,
  equipment,
  sessionMinutes,
  seed,
  loading,
  onGoalChange,
  onDaysChange,
  onExperienceChange,
  onEquipmentChange,
  onSessionMinutesChange,
  onSeedChange,
  onSubmit,
  onStartCustom
}: Props) {
  const { language } = useLanguage();
  const w = strings.workout;

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label={t(w.goalLabel, language)}>
        <select value={goal} onChange={(event) => onGoalChange(event.target.value as WorkoutGoal)} className={inputClass}>
          {goals.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label={t(w.experienceLabel, language)}>
        <select value={experienceLevel} onChange={(event) => onExperienceChange(event.target.value)} className={inputClass}>
          {experienceLevels.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label={t(w.daysLabel, language)}>
        <input value={daysPerWeek} onChange={(event) => onDaysChange(event.target.value)} type="number" min="2" max="6" className={inputClass} />
      </Field>
      <Field label={t(w.sessionMinutesLabel, language)}>
        <input value={sessionMinutes} onChange={(event) => onSessionMinutesChange(event.target.value)} type="number" min="30" max="120" className={inputClass} />
      </Field>
      <Field label={t(w.equipmentLabel, language)}>
        <select value={equipment} onChange={(event) => onEquipmentChange(event.target.value as WorkoutEquipment)} className={inputClass}>
          {equipmentOptions.map((item) => (
            <option key={item} value={item}>{item.replace("_", " ")}</option>
          ))}
        </select>
      </Field>
      <Field label={t(w.seedLabel, language)}>
        <input value={seed} onChange={(event) => onSeedChange(event.target.value)} placeholder={t(w.seedPlaceholder, language)} className={inputClass} />
      </Field>

      <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          <DumbbellIcon className="size-4" />
          {loading ? t(w.building, language) : t(w.buildPlan, language)}
        </button>
        <button type="button" onClick={onStartCustom} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-card-foreground transition hover:border-primary/40 hover:bg-muted">
          {t(w.createCustom, language)}
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
