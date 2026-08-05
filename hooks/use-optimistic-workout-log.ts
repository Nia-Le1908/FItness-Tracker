"use client";

import { useCallback, useOptimistic, useRef, startTransition } from "react";
import type { WorkoutSetLog } from "@/types";
import { authedJsonFetch } from "@/lib/api/client";

interface OptimisticSetInput {
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
}

export function useOptimisticWorkoutLog() {
  const [optimisticLogs, addOptimisticLog] = useOptimistic<
    WorkoutSetLog[],
    WorkoutSetLog
  >([], (_state, newLog) => {
    return [newLog];
  });

  const pendingRef = useRef(false);

  const logSet = useCallback(async (input: OptimisticSetInput) => {
    const optimisticEntry: WorkoutSetLog = {
      id: `opt-${Date.now()}`,
      workoutDate: new Date().toISOString().slice(0, 10),
      recordedAt: new Date().toISOString(),
      exerciseName: input.exerciseName,
      setNumber: input.setNumber,
      reps: input.reps,
      weightKg: input.weightKg
    };

    pendingRef.current = true;
    startTransition(() => {
      addOptimisticLog(optimisticEntry);
    });

    try {
      const payload = await authedJsonFetch<{ entry: WorkoutSetLog }>("/api/workout-logs", {
        method: "POST",
        body: JSON.stringify({
          exerciseName: input.exerciseName,
          setNumber: input.setNumber,
          reps: input.reps,
          weightKg: input.weightKg
        })
      });
      pendingRef.current = false;
      return payload.entry;
    } catch (err) {
      pendingRef.current = false;
      console.error("[workout-log] failed to save set:", err);
      return null;
    }
  }, [addOptimisticLog]);

  return {
    logSet,
    isPending: pendingRef.current,
    lastOptimistic: optimisticLogs.length > 0 ? optimisticLogs[0] : null
  };
}
