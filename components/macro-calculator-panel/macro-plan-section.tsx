"use client";

import type { MacroPlanVersion, MacroTargets } from "@/types";

export function MacroPlanSection({
  historyError,
  editableMacro,
  result,
  planName,
  planId,
  planVersions,
  isEditing,
  savingPlan,
  historyLoading,
  onPlanNameChange,
  onCustomizeTarget,
  onDoneEditing,
  onSavePlan,
  onLoadHistory,
  onUpdateMacro,
  inputClass
}: {
  historyError: string | null;
  editableMacro: MacroTargets | null;
  result: MacroTargets | null;
  planName: string;
  planId: string | null;
  planVersions: MacroPlanVersion[];
  isEditing: boolean;
  savingPlan: boolean;
  historyLoading: boolean;
  onPlanNameChange: (value: string) => void;
  onCustomizeTarget: () => void;
  onDoneEditing: () => void;
  onSavePlan: () => Promise<void>;
  onLoadHistory: () => Promise<void>;
  onUpdateMacro: (updates: Partial<MacroTargets>) => void;
  inputClass: string;
}) {
  if (!editableMacro && !result) {
    return null;
  }

  const activeMacro = editableMacro ?? result!;

  return (
    <div className="mt-6 space-y-4">
      {historyError ? <p className="mt-2 text-sm text-red-400">{historyError}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input value={planName} onChange={(event) => onPlanNameChange(event.target.value)} disabled={!isEditing} className={isEditing ? "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground" : "w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground"} />
          {!isEditing && editableMacro ? (
            <button type="button" onClick={onDoneEditing} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              Chỉnh sửa / Edit target
            </button>
          ) : null}
          {!isEditing && !editableMacro && result ? (
            <button type="button" onClick={onCustomizeTarget} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              Tuỳ chỉnh / Customize target
            </button>
          ) : null}
          {isEditing ? (
            <button type="button" onClick={onDoneEditing} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              Xong / Done
            </button>
          ) : null}
        </div>

        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSavePlan} disabled={savingPlan} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {savingPlan ? "Đang lưu... / Saving..." : "Lưu mục tiêu / Save target"}
            </button>
            {planId ? (
              <button type="button" onClick={onLoadHistory} disabled={historyLoading} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
                {historyLoading ? "Đang tải... / Loading..." : "Xem lịch sử / View history"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {planVersions.length > 0 ? (
        <div className="rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground">
          {"Phiên bản gần nhất / Latest versions:"} {planVersions.slice(0, 3).map((version) => new Date(version.createdAt).toLocaleDateString()).join(" · ")}
        </div>
      ) : null}

      {isEditing ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Calories">
            <input value={activeMacro.calories} onChange={(event) => onUpdateMacro({ calories: Number(event.target.value) })} type="number" min="0" className={inputClass} />
          </Field>
          <Field label="Protein (g)">
            <input value={activeMacro.proteinGrams} onChange={(event) => onUpdateMacro({ proteinGrams: Number(event.target.value) })} type="number" min="0" className={inputClass} />
          </Field>
          <Field label="Carbs (g)">
            <input value={activeMacro.carbsGrams} onChange={(event) => onUpdateMacro({ carbsGrams: Number(event.target.value) })} type="number" min="0" className={inputClass} />
          </Field>
          <Field label="Fat (g)">
            <input value={activeMacro.fatGrams} onChange={(event) => onUpdateMacro({ fatGrams: Number(event.target.value) })} type="number" min="0" className={inputClass} />
          </Field>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="LBM" value={`${activeMacro.leanBodyMassKg.toFixed(1)} kg`} />
          <Stat label="Calories" value={`${activeMacro.calories} kcal`} />
          <Stat label="Protein" value={`${activeMacro.proteinGrams} g`} />
          <Stat label="Carbs" value={`${activeMacro.carbsGrams} g`} />
          <Stat label="Fat" value={`${activeMacro.fatGrams} g`} />
          <Stat label="BMR" value={`${activeMacro.bmrCalories} kcal`} />
        </div>
      )}
    </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-card-foreground">{value}</p>
    </div>
  );
}
