"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { authedJsonFetch, fetchJson } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import type { WorkoutSetLog, WorkoutPlan, WorkoutPlanVersion } from "@/types";
import { useUiFeedback } from "@/lib/ui-feedback";
import { useWorkoutPlan } from "@/hooks/use-workout-plan";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

import { PlannerForm } from "./workout/planner-form";
import { TemplateGallery } from "./workout/template-gallery";
import { PlanToolbar } from "./workout/plan-toolbar";
import { DayList } from "./workout/day-list";
import { DayDetail } from "./workout/day-detail";
import { ExerciseProgressChart } from "./workout/exercise-progress-chart";
import { SessionBar } from "./workout/session-bar";
import { VolumeSummary } from "./workout/volume-summary";
import type { SetLoggerValue } from "./workout/set-logger";

const MAX_EXPERIENCES = ["beginner", "intermediate", "advanced"];
const MAX_EQUIPMENT = ["bodyweight", "dumbbells", "full_gym"];

export function WorkoutPlannerPanel() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { pushNotice, setBanner } = useUiFeedback();
  const { language } = useLanguage();
  const w = strings.workout;

  const plan = useWorkoutPlan();
  const session = useWorkoutSession();
  const { profile, loading: profileLoading } = useUserProfile();
  const [goalFromProfile, setGoalFromProfile] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [setInputs, setSetInputs] = useState<Record<string, SetLoggerValue>>({});
  const [setLogs, setSetLogs] = useState<Record<string, WorkoutSetLog[]>>({});
  const [savingSetKey, setSavingSetKey] = useState<string | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, WorkoutSetLog[]>>({});
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [restTimerKey, setRestTimerKey] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { setSignedIn(false); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setSignedIn(Boolean(data.session)); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setSignedIn(Boolean(session)); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    async function loadLatestPlan() {
      if (!signedIn || plan.editablePlan || plan.result) return;
      try {
        const payload = await authedJsonFetch<{ version: WorkoutPlanVersion | null }>("/api/workout-plans?latest=1");
        if (!active) return;
        if (payload.version) {
          plan.setEditablePlan(payload.version.plan);
          plan.setPlanId(payload.version.planId);
          plan.setPlanVersions([payload.version]);
          plan.setPlanName(`Custom plan ${new Date(payload.version.createdAt).toLocaleDateString()}`);
          plan.setIsEditing(false);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Unable to load latest plan.";
        if (active) setHistoryError(message);
        pushNotice({ title: "Workout history error", message, tone: "error" });
        setBanner({ title: "Workout history error", message, tone: "error" });
      }
    }
    loadLatestPlan();
    return () => { active = false; };
  }, [signedIn]);

  useEffect(() => {
    const nextGoal = searchParams.get("goal");
    if (nextGoal && ["cut", "maintain", "bulk"].includes(nextGoal)) plan.setGoal(nextGoal as typeof plan.goal);
    const nextDays = Number(searchParams.get("daysPerWeek"));
    if (Number.isFinite(nextDays) && nextDays >= 2 && nextDays <= 6) plan.setDaysPerWeek(String(nextDays));
    const nextExp = searchParams.get("experienceLevel");
    if (nextExp && MAX_EXPERIENCES.includes(nextExp)) plan.setExperienceLevel(nextExp);
    const nextEq = searchParams.get("equipment");
    if (nextEq && MAX_EQUIPMENT.includes(nextEq)) plan.setEquipment(nextEq as typeof plan.equipment);
    const nextMins = Number(searchParams.get("sessionMinutes"));
    if (Number.isFinite(nextMins) && nextMins >= 30) plan.setSessionMinutes(String(nextMins));
    const nextSeed = searchParams.get("seed");
    if (nextSeed) plan.setSeed(nextSeed);
  }, [searchParams]);

  useEffect(() => {
    if (goalFromProfile || profileLoading || searchParams.get("goal")) return;
    if (profile.goal) {
      plan.setGoal(profile.goal);
      setGoalFromProfile(true);
    }
  }, [goalFromProfile, profileLoading, profile.goal, searchParams]);

  useEffect(() => {
    if (!plan.result) {
      setSetInputs({}); setSetLogs({}); setExerciseProgress({});
      setSelectedExercise(null); setProgressError(null);
      plan.setEditablePlan(null); plan.setIsEditing(false);
      plan.setPlanId(null); plan.setPlanVersions([]);
      setHistoryError(null);
    } else if (!plan.isEditing) {
      plan.setPlanName(`${plan.result.splitName} plan`);
    }
  }, [plan.result]);

  useEffect(() => {
    const planSource = plan.editablePlan ?? plan.result;
    if (planSource?.days.length && !plan.selectedDay) {
      plan.setSelectedDay(planSource.days[0].name);
    }
  }, [plan.editablePlan, plan.result]);

  function getSetKey(dayName: string, exerciseName: string): string {
    return `${dayName}-${exerciseName}`;
  }

  function updateSetInput(key: string, next: Partial<SetLoggerValue>) {
    setSetInputs((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { setNumber: "1", reps: "", weightKg: "" }), ...next }
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = await fetchJson<WorkoutPlan>("/api/workout", {
        method: "POST",
        body: JSON.stringify({
          goal: plan.goal,
          daysPerWeek: Number(plan.daysPerWeek),
          experienceLevel: plan.experienceLevel,
          equipment: plan.equipment,
          sessionMinutes: Number(plan.sessionMinutes),
          seed: plan.seed.trim().length > 0 ? plan.seed.trim() : undefined
        })
      });
      plan.setResult(payload);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t(w.buildError, language);
      setError(message);
      pushNotice({ title: "Workout build error", message, tone: "error" });
      setBanner({ title: "Workout build error", message, tone: "error" });
      plan.setResult(null);
    } finally { setLoading(false); }
  }

  async function handleSavePlan() {
    const current = plan.editablePlan;
    if (!current || !plan.planName.trim()) return;
    setSaving(true); setError(null);
    try {
      const payload = await authedJsonFetch<{ planId: string; version: WorkoutPlanVersion }>("/api/workout-plans", {
        method: "POST",
        body: JSON.stringify({ planId: plan.planId, name: plan.planName.trim(), plan: current, source: plan.isEditing ? "custom" : "generated" })
      });
      plan.handlePlanSaved(payload.planId, payload.version);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t(w.saveError, language);
      setError(message);
      pushNotice({ title: "Workout save error", message, tone: "error" });
      setBanner({ title: "Workout save error", message, tone: "error" });
    } finally { setSaving(false); }
  }

  async function handleLoadHistory() {
    if (!plan.planId) return;
    setHistoryLoading(true); setHistoryError(null);
    try {
      const payload = await authedJsonFetch<{ versions: WorkoutPlanVersion[] }>(`/api/workout-plans?planId=${plan.planId}`);
      plan.setPlanVersions(payload.versions);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t(w.historyError, language);
      setHistoryError(message);
    } finally { setHistoryLoading(false); }
  }

  async function handleSaveSet(dayName: string, exerciseName: string, defaultReps: string) {
    if (!signedIn) {
      setError(t(w.signInRequired, language));
      return;
    }
    const key = getSetKey(dayName, exerciseName);
    const input = setInputs[key] ?? { setNumber: "1", reps: defaultReps, weightKg: "" };
    const setNumber = Number(input.setNumber);
    const reps = Number(input.reps);
    const weightKg = Number(input.weightKg);
    if (!Number.isFinite(setNumber) || setNumber <= 0 || !Number.isFinite(reps) || reps <= 0 || !Number.isFinite(weightKg) || weightKg < 0) {
      setError(t(w.logSetError, language));
      return;
    }
    setSavingSetKey(key); setError(null);
    try {
      const payload = await authedJsonFetch<{ entry: WorkoutSetLog }>("/api/workout-logs", {
        method: "POST",
        body: JSON.stringify({
          workoutDate: new Date().toISOString().slice(0, 10),
          exerciseName,
          setNumber,
          reps,
          weightKg,
          sessionId: session.activeSessionId
        })
      });
      setSetLogs((current) => ({ ...current, [key]: [payload.entry, ...(current[key] ?? [])] }));
      setExerciseProgress((current) => {
        if (selectedExercise !== exerciseName) return current;
        return { ...current, [exerciseName]: [payload.entry, ...(current[exerciseName] ?? [])] };
      });
      updateSetInput(key, { setNumber: String(setNumber + 1) });
      const activePlanNow = plan.editablePlan ?? plan.result;
      if (activePlanNow) {
        for (const d of activePlanNow.days) {
          const ex = d.exercises.find((e) => e.name === exerciseName);
          if (ex) {
            setRestTimerKey(key);
            setRestTimerSeconds(ex.restSeconds);
            break;
          }
        }
      }
    } catch {
      setError(t(w.logSetError, language));
    } finally { setSavingSetKey(null); }
  }

  async function handleUpdateSet(id: string, patch: { setNumber?: number; reps?: number; weightKg?: number }) {
    try {
      const payload = await authedJsonFetch<{ entry: WorkoutSetLog }>("/api/workout-logs", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch })
      });
      const entry = payload.entry;
      setSetLogs((current) => {
        const next: Record<string, WorkoutSetLog[]> = {};
        let matchedKey: string | null = null;
        for (const key of Object.keys(current)) {
          const idx = current[key].findIndex((log) => log.id === id);
          if (idx !== -1) matchedKey = key;
          next[key] = idx !== -1
            ? [...current[key].slice(0, idx), entry, ...current[key].slice(idx + 1)]
            : [...current[key]];
        }
        return next;
      });
    } catch {
      pushNotice({ title: "Update error", message: "Cannot update set.", tone: "error" });
    }
  }

  async function handleDeleteSet(id: string) {
    try {
      await fetchJson("/api/workout-logs?id=" + encodeURIComponent(id), { method: "DELETE" });
      setSetLogs((current) => {
        const next: Record<string, WorkoutSetLog[]> = {};
        for (const key of Object.keys(current)) {
          next[key] = current[key].filter((log) => log.id !== id);
        }
        return next;
      });
      setExerciseProgress((current) => {
        if (!selectedExercise) return current;
        return {
          ...current,
          [selectedExercise]: (current[selectedExercise] ?? []).filter((log) => log.id !== id)
        };
      });
    } catch {
      pushNotice({ title: "Delete error", message: "Cannot delete set.", tone: "error" });
    }
  }

  function handleRestTimerDone() {
    setRestTimerSeconds(null);
    setRestTimerKey(null);
  }

  async function handleSelectExercise(exerciseName: string) {
    setSelectedExercise(exerciseName); setProgressError(null);
    if (!signedIn) return;
    if (exerciseProgress[exerciseName]) return;
    setProgressLoading(true);
    try {
      const payload = await authedJsonFetch<{ entries: WorkoutSetLog[] }>(`/api/workout-logs?exerciseName=${encodeURIComponent(exerciseName)}&limit=200`);
      setExerciseProgress((current) => ({ ...current, [exerciseName]: payload.entries }));
    } catch {
      setProgressError(t(w.progressError, language));
    } finally { setProgressLoading(false); }
  }

  const exerciseChartData = useMemo(() => {
    if (!selectedExercise) return [];
    const logs = exerciseProgress[selectedExercise] ?? [];
    const dailyMap = new Map<string, { date: string; maxWeight: number; totalReps: number }>();
    for (const log of logs) {
      const existing = dailyMap.get(log.workoutDate);
      if (!existing) { dailyMap.set(log.workoutDate, { date: log.workoutDate, maxWeight: log.weightKg, totalReps: log.reps }); continue; }
      existing.maxWeight = Math.max(existing.maxWeight, log.weightKg);
      existing.totalReps += log.reps;
    }
    return [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [exerciseProgress, selectedExercise]);

  const activePlan = plan.editablePlan ?? plan.result;

  function handleUseTemplate(templatePlan: WorkoutPlan, templateName: string) {
    plan.setEditablePlan(templatePlan);
    plan.setPlanName(templateName);
    plan.setPlanId(null);
    plan.setPlanVersions([]);
    plan.setIsEditing(true);
    plan.setSelectedDay(templatePlan.days[0]?.name ?? null);
    setHistoryError(null);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{t(w.plannerEyebrow, language)}</p>
          <h1 className="mt-2 text-2xl font-semibold text-card-foreground sm:text-3xl">{t(w.plannerTitle, language)}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t(w.plannerDesc, language)}</p>

          <PlannerForm
            goal={plan.goal}
            daysPerWeek={plan.daysPerWeek}
            experienceLevel={plan.experienceLevel}
            equipment={plan.equipment}
            sessionMinutes={plan.sessionMinutes}
            seed={plan.seed}
            loading={loading}
            onGoalChange={plan.setGoal}
            onDaysChange={plan.setDaysPerWeek}
            onExperienceChange={plan.setExperienceLevel}
            onEquipmentChange={plan.setEquipment}
            onSessionMinutesChange={plan.setSessionMinutes}
            onSeedChange={plan.setSeed}
            onSubmit={handleSubmit}
            onStartCustom={plan.startCustomPlan}
          />

          <TemplateGallery onUsePlan={handleUseTemplate} />

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {!signedIn ? <p className="mt-2 text-sm text-muted-foreground">{t(w.signInToSave, language)}</p> : null}

          {activePlan ? (
            <div className="mt-6 space-y-4">
              <PlanToolbar
                planName={plan.planName}
                isEditing={plan.isEditing}
                hasEditablePlan={!!plan.editablePlan}
                hasResult={!!plan.result}
                planId={plan.planId}
                saving={saving}
                historyLoading={historyLoading}
                onPlanNameChange={plan.setPlanName}
                onEdit={() => plan.setIsEditing(true)}
                onCustomize={plan.customizeGenerated}
                onDone={() => plan.setIsEditing(false)}
                onSave={handleSavePlan}
                onHistory={handleLoadHistory}
              />

              {historyError ? <p className="text-sm text-red-400">{historyError}</p> : null}
              {plan.planVersions.length > 0 ? (
                <div className="rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground">
                  {t(w.historyLatest, language)}: {plan.planVersions.slice(0, 3).map((v) => new Date(v.createdAt).toLocaleDateString()).join(" · ")}
                </div>
              ) : null}

              {signedIn ? (
                <SessionBar
                  active={!!session.activeSession}
                  elapsed={session.formatted}
                  starting={session.starting}
                  finishing={session.finishing}
                  onStart={session.start}
                  onFinish={session.finish}
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label={t(w.split, language)} value={activePlan.splitName} />
                <Stat label={t(w.sessions, language)} value={`${activePlan.weeklySessions} / week`} />
                <Stat label={t(w.exercises, language)} value={`${activePlan.totalExercises} total`} />
                <Stat label={t(w.sessionLength, language)} value={`${activePlan.sessionMinutes} min`} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
                <DayList
                  plan={activePlan}
                  selectedDay={plan.selectedDay}
                  isEditing={plan.isEditing}
                  onSelectDay={plan.setSelectedDay}
                  onAddDay={plan.addDay}
                />

                {plan.selectedDay ? (
                  <DayDetail
                    plan={activePlan}
                    selectedDay={plan.selectedDay}
                    isEditing={plan.isEditing}
                    setInputs={setInputs}
                    setLogs={setLogs}
                    savingSetKey={savingSetKey}
                    signedIn={signedIn}
                    onUpdateDay={plan.updateDay}
                    onRemoveDay={plan.removeDay}
                    onUpdateExercise={plan.updateExercise}
                    onRemoveExercise={plan.removeExercise}
                    onAddExercise={plan.addExercise}
                    onUpdateSetInput={updateSetInput}
                    onSaveSet={handleSaveSet}
                    onUpdateSet={handleUpdateSet}
                    onDeleteSet={handleDeleteSet}
                    onViewProgress={handleSelectExercise}
                    restTimerSeconds={restTimerSeconds}
                    restTimerKey={restTimerKey}
                    onRestTimerDone={handleRestTimerDone}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-sm text-muted-foreground">
                    {t(w.selectDay, language)}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <VolumeSummary logs={Object.values(setLogs).flat()} />

          {selectedExercise ? (
            <ExerciseProgressChart
              exerciseName={selectedExercise}
              chartData={exerciseChartData}
              loading={progressLoading}
              error={progressError}
              signedIn={signedIn}
            />
          ) : null}
        </div>
      </section>
    </main>
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
