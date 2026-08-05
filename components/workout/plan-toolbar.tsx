"use client";

import { SettingsIcon, ChevronDownIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none";
const mutedClass = "w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground";

interface Props {
  planName: string;
  isEditing: boolean;
  hasEditablePlan: boolean;
  hasResult: boolean;
  planId: string | null;
  saving: boolean;
  historyLoading: boolean;
  onPlanNameChange: (value: string) => void;
  onEdit: () => void;
  onCustomize: () => void;
  onDone: () => void;
  onSave: () => void;
  onHistory: () => void;
}

export function PlanToolbar({
  planName,
  isEditing,
  hasEditablePlan,
  hasResult,
  planId,
  saving,
  historyLoading,
  onPlanNameChange,
  onEdit,
  onCustomize,
  onDone,
  onSave,
  onHistory
}: Props) {
  const { language } = useLanguage();
  const w = strings.workout;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={planName}
          onChange={(event) => onPlanNameChange(event.target.value)}
          disabled={!isEditing}
          className={isEditing ? inputClass : mutedClass}
        />
        {!isEditing && hasEditablePlan ? (
          <button type="button" onClick={onEdit} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
            {t(w.editPlan, language)}
          </button>
        ) : null}
        {!isEditing && !hasEditablePlan && hasResult ? (
          <button type="button" onClick={onCustomize} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
            <SettingsIcon className="mr-1.5 inline size-4" />
            {t(w.customizePlan, language)}
          </button>
        ) : null}
        {isEditing ? (
          <button type="button" onClick={onDone} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
            {t(w.done, language)}
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {saving ? t(w.saving, language) : t(w.savePlan, language)}
          </button>
          {planId ? (
            <button type="button" onClick={onHistory} disabled={historyLoading} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              <ChevronDownIcon className="mr-1.5 inline size-4" />
              {historyLoading ? t(w.loadingHistory, language) : t(w.viewHistory, language)}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
