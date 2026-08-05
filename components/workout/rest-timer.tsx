"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

interface Props {
  seconds: number;
  onFinish: () => void;
  onClose: () => void;
}

function fmt(remaining: number): string {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RestTimer({ seconds, onFinish, onClose }: Props) {
  const { language } = useLanguage();
  const w = strings.workout;
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (paused) {
      clear();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clear();
          if (!finishedRef.current) {
            finishedRef.current = true;
            setTimeout(onFinish, 50);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return clear;
  }, [paused, clear, onFinish]);

  useEffect(() => {
    return clear;
  }, [clear]);

  const progress = (remaining / seconds) * 100;

  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tabular-nums text-primary">
            {fmt(remaining)}
          </span>
          <span className="text-xs text-muted-foreground">
            {remaining <= 5 ? "..." : remaining <= 15 ? t(w.restAlmostDone, language) : t(w.restLabel, language)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPaused((v) => !v)} className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
            {paused ? t(w.restResume, language) : t(w.restPause, language)}
          </button>
          <button type="button" onClick={() => setRemaining((v) => v + 15)} className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
            +15s
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
            {t(w.restSkip, language)}
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
