"use client";

import { FlameIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

interface Props {
  active: boolean;
  elapsed: string;
  starting: boolean;
  finishing: boolean;
  onStart: () => void;
  onFinish: () => void;
}

export function SessionBar({ active, elapsed, starting, finishing, onStart, onFinish }: Props) {
  const { language } = useLanguage();
  const w = strings.workout;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-3 w-3 rounded-full ${active ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            {active ? t(w.sessionActive, language) : t(w.sessionInactive, language)}
          </p>
          {active ? (
            <p className="text-xl font-bold tabular-nums text-primary">{elapsed}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t(w.sessionHint, language)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!active ? (
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <FlameIcon className="size-4" />
            {starting ? t(w.saving, language) : t(w.startSession, language)}
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            disabled={finishing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-card-foreground transition hover:border-primary/40 disabled:opacity-60"
          >
            {finishing ? t(w.saving, language) : t(w.finishSession, language)}
          </button>
        )}
      </div>
    </div>
  );
}
