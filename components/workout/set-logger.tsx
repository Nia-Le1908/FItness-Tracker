"use client";

import { useState } from "react";
import type { WorkoutSetLog } from "@/types";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";
import { FlameIcon, SettingsIcon } from "@/components/icons";

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none";
const inlineClass = "rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none";

export interface SetLoggerValue {
  setNumber: string;
  reps: string;
  weightKg: string;
}

interface Props {
  setKey: string;
  exerciseReps: string;
  setInput: SetLoggerValue | undefined;
  logs: WorkoutSetLog[];
  signedIn: boolean;
  saving: boolean;
  onInputChange: (next: Partial<SetLoggerValue>) => void;
  onSave: () => void;
  onUpdate: (id: string, patch: { setNumber?: number; reps?: number; weightKg?: number }) => void;
  onDelete: (id: string) => void;
}

export function SetLogger({
  setKey,
  exerciseReps,
  setInput,
  logs,
  signedIn,
  saving,
  onInputChange,
  onSave,
  onUpdate,
  onDelete
}: Props) {
  const { language } = useLanguage();
  const w = strings.workout;
  const input = setInput ?? { setNumber: "1", reps: exerciseReps, weightKg: "" };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ setNumber: string; reps: string; weightKg: string }>({ setNumber: "", reps: "", weightKg: "" });

  function prefetchLastSet() {
    const last = logs[0];
    if (!last) return;
    onInputChange({
      setNumber: String(last.setNumber + 1),
      reps: String(last.reps),
      weightKg: String(last.weightKg)
    });
  }

  function startEdit(log: WorkoutSetLog) {
    setEditingId(log.id);
    setEditValues({
      setNumber: String(log.setNumber),
      reps: String(log.reps),
      weightKg: String(log.weightKg)
    });
  }

  function saveEdit() {
    if (!editingId) return;
    onUpdate(editingId, {
      setNumber: Number(editValues.setNumber),
      reps: Number(editValues.reps),
      weightKg: Number(editValues.weightKg)
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input
          value={input.setNumber}
          onChange={(event) => onInputChange({ setNumber: event.target.value })}
          type="number"
          min="1"
          className={inputClass}
          placeholder={t(w.setLabel, language)}
        />
        <input
          value={input.reps}
          onChange={(event) => onInputChange({ reps: event.target.value })}
          type="number"
          min="1"
          className={inputClass}
          placeholder={t(w.repsLabel, language)}
        />
        <input
          value={input.weightKg}
          onChange={(event) => onInputChange({ weightKg: event.target.value })}
          type="number"
          min="0"
          step="0.5"
          className={inputClass}
          placeholder={t(w.weightLabel, language)}
        />
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onSave}
            disabled={!signedIn || saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FlameIcon className="size-4" />
            {saving ? t(w.saving, language) : t(w.saveSet, language)}
          </button>
          {logs.length > 0 ? (
            <button
              type="button"
              onClick={prefetchLastSet}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {t(w.lastSet, language)}
            </button>
          ) : null}
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="mt-3 space-y-2">
          {logs.slice(0, 8).map((log) => {
            if (editingId === log.id) {
              return (
                <div key={log.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-background px-3 py-2 text-xs">
                  <input
                    value={editValues.setNumber}
                    onChange={(event) => setEditValues((v) => ({ ...v, setNumber: event.target.value }))}
                    type="number"
                    min="1"
                    className={inlineClass}
                    style={{ width: 60 }}
                    placeholder="Set"
                  />
                  <input
                    value={editValues.reps}
                    onChange={(event) => setEditValues((v) => ({ ...v, reps: event.target.value }))}
                    type="number"
                    min="1"
                    className={inlineClass}
                    style={{ width: 60 }}
                    placeholder="Reps"
                  />
                  <input
                    value={editValues.weightKg}
                    onChange={(event) => setEditValues((v) => ({ ...v, weightKg: event.target.value }))}
                    type="number"
                    min="0"
                    step="0.5"
                    className={inlineClass}
                    style={{ width: 72 }}
                    placeholder="Kg"
                  />
                  <button type="button" onClick={saveEdit} className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90">
                    {t(w.save, language)}
                  </button>
                  <button type="button" onClick={cancelEdit} className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground">
                    {t(w.cancel, language)}
                  </button>
                </div>
              );
            }

            return (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
                <span>Set {log.setNumber} · {log.reps} reps · {log.weightKg} kg</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => startEdit(log)} className="rounded-md border border-border px-1.5 py-0.5 text-muted-foreground transition hover:border-primary/40 hover:text-foreground" title={t(w.edit, language)}>
                    <SettingsIcon className="size-3" />
                  </button>
                  <button type="button" onClick={() => onDelete(log.id)} className="rounded-md border border-border px-1.5 py-0.5 text-muted-foreground transition hover:border-red-400 hover:text-red-400" title={t(w.delete, language)}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
