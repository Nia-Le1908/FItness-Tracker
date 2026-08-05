"use client";

import type { WorkoutFocus, WorkoutEquipment } from "@/types";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";
import { SetLogger, type SetLoggerValue } from "./set-logger";
import { RestTimer } from "./rest-timer";

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary";
const focusOptions: WorkoutFocus[] = ["full_body", "upper", "lower", "push", "pull", "legs"];
const equipmentOptions: WorkoutEquipment[] = ["bodyweight", "dumbbells", "full_gym"];

interface Props {
  plan: import("@/types").WorkoutPlan;
  selectedDay: string;
  isEditing: boolean;
  setInputs: Record<string, SetLoggerValue>;
  setLogs: Record<string, import("@/types").WorkoutSetLog[]>;
  savingSetKey: string | null;
  signedIn: boolean;
  onUpdateDay: (dayName: string, updates: { name?: string; focus?: WorkoutFocus }) => void;
  onRemoveDay: (dayName: string) => void;
  onUpdateExercise: (dayName: string, index: number, updates: Partial<import("@/types").WorkoutPlan["days"][number]["exercises"][number]>) => void;
  onRemoveExercise: (dayName: string, index: number) => void;
  onAddExercise: (dayName: string) => void;
  onUpdateSetInput: (key: string, next: Partial<SetLoggerValue>) => void;
  onSaveSet: (dayName: string, exerciseName: string, defaultReps: string) => void;
  onUpdateSet: (id: string, patch: { setNumber?: number; reps?: number; weightKg?: number }) => void;
  onDeleteSet: (id: string) => void;
  onViewProgress: (exerciseName: string) => void;
  onRestTimerDone: () => void;
  restTimerSeconds: number | null;
  restTimerKey: string | null;
}

export function DayDetail({
  plan,
  selectedDay,
  isEditing,
  setInputs,
  setLogs,
  savingSetKey,
  signedIn,
  onUpdateDay,
  onRemoveDay,
  onUpdateExercise,
  onRemoveExercise,
  onAddExercise,
  onUpdateSetInput,
  onSaveSet,
  onUpdateSet,
  onDeleteSet,
  onViewProgress,
  onRestTimerDone,
  restTimerSeconds,
  restTimerKey
}: Props) {
  const { language } = useLanguage();
  const w = strings.workout;

  const day = plan.days.find((d) => d.name === selectedDay);
  if (!day) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-sm text-muted-foreground">
        {t(w.selectDay, language)}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          {isEditing ? (
            <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr]">
              <input
                value={day.name}
                onChange={(event) => onUpdateDay(selectedDay, { name: event.target.value })}
                className={inputClass}
                placeholder={t(w.dayNamePlaceholder, language)}
              />
              <select
                value={day.focus}
                onChange={(event) => onUpdateDay(selectedDay, { focus: event.target.value as WorkoutFocus })}
                className={inputClass}
              >
                {focusOptions.map((f) => (
                  <option key={f} value={f}>{f.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-card-foreground">{day.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{day.focus.replace("_", " ")}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{plan.goal}</span>
          {isEditing ? (
            <button type="button" onClick={() => onRemoveDay(selectedDay)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              {t(w.removeDay, language)}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-card-foreground">{t(w.exercisesSection, language)}</p>
            <p className="text-xs text-muted-foreground">{t(w.exercisesSectionHint, language)}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{day.exercises.length} total</span>
        </div>

        <div className="mt-4 space-y-3">
          {day.exercises.map((exercise, index) => {
            const key = `${day.name}-${exercise.name}`;
            const setInput = setInputs[key];
            const logs = setLogs[key] ?? [];

            if (isEditing) {
              return (
                <div key={`${day.name}-${index}`} className="rounded-xl border border-border bg-background px-3 py-3 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-card-foreground">Exercise {index + 1}</p>
                      <p className="text-xs text-muted-foreground">{t(w.editExerciseHint, language)}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{exercise.equipment.replace("_", " ")}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1.6fr_0.6fr_0.6fr_0.6fr_1fr_auto]">
                    <input value={exercise.name} onChange={(event) => onUpdateExercise(day.name, index, { name: event.target.value })} className={inputClass} placeholder={t(w.exerciseNamePlaceholder, language)} />
                    <input value={exercise.sets} onChange={(event) => onUpdateExercise(day.name, index, { sets: Number(event.target.value) })} type="number" min="1" className={inputClass} placeholder="Sets" />
                    <input value={exercise.reps} onChange={(event) => onUpdateExercise(day.name, index, { reps: event.target.value })} className={inputClass} placeholder="Reps" />
                    <input value={exercise.restSeconds} onChange={(event) => onUpdateExercise(day.name, index, { restSeconds: Number(event.target.value) })} type="number" min="0" className={inputClass} placeholder="Rest" />
                    <select value={exercise.equipment} onChange={(event) => onUpdateExercise(day.name, index, { equipment: event.target.value as WorkoutEquipment })} className={inputClass}>
                      {equipmentOptions.map((e) => (
                        <option key={e} value={e}>{e.replace("_", " ")}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => onRemoveExercise(day.name, index)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                      {t(w.removeDay, language)}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="rounded-xl border border-border bg-card px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-card-foreground">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.sets} sets · {exercise.reps} reps · {exercise.restSeconds}s rest
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onViewProgress(exercise.name)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                      {t(w.viewProgress, language)}
                    </button>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{exercise.equipment.replace("_", " ")}</span>
                  </div>
                </div>

                <SetLogger
                  key={key}
                  setKey={key}
                  exerciseReps={exercise.reps}
                  setInput={setInput}
                  logs={logs}
                  signedIn={signedIn}
                  saving={savingSetKey === key}
                  onInputChange={(next) => onUpdateSetInput(key, next)}
                  onSave={() => onSaveSet(day.name, exercise.name, exercise.reps)}
                  onUpdate={onUpdateSet}
                  onDelete={onDeleteSet}
                />

                {restTimerKey === key && restTimerSeconds !== null ? (
                  <div className="mt-2">
                    <RestTimer
                      seconds={restTimerSeconds}
                      onFinish={onRestTimerDone}
                      onClose={onRestTimerDone}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}

          {isEditing ? (
            <button type="button" onClick={() => onAddExercise(day.name)} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              {t(w.addExercise, language)}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
