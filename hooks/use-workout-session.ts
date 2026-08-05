"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkoutSession } from "@/types";
import { authedJsonFetch } from "@/lib/api/client";

export function useWorkoutSession() {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasActive = activeSession !== null;

  useEffect(() => {
    if (!activeSession) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startTime = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSession]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(async () => {
    if (activeSession) return null;
    setStarting(true);
    try {
      const payload = await authedJsonFetch<{ session: WorkoutSession }>("/api/workout-sessions", {
        method: "POST",
        body: JSON.stringify({})
      });
      setActiveSession(payload.session);
      setElapsed(0);
      return payload.session.id;
    } catch (err) {
      console.error("[workout-session] failed to start:", err);
      return null;
    } finally {
      setStarting(false);
    }
  }, [activeSession]);

  const finish = useCallback(async () => {
    if (!activeSession) return;
    setFinishing(true);
    try {
      await authedJsonFetch<{ session: WorkoutSession }>("/api/workout-sessions", {
        method: "PATCH",
        body: JSON.stringify({ id: activeSession.id, durationSeconds: elapsed })
      });
      setActiveSession(null);
      setElapsed(0);
    } catch (err) {
      console.error("[workout-session] failed to finish:", err);
    } finally {
      setFinishing(false);
    }
  }, [activeSession, elapsed]);

  const formatted = useMemo(() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  return {
    activeSession,
    activeSessionId: activeSession?.id ?? null,
    elapsed,
    formatted,
    starting,
    finishing,
    start,
    finish
  };
}
