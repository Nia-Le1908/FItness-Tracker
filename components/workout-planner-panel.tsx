"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { authedJsonFetch, fetchJson } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import type { WorkoutEquipment, WorkoutExperience, WorkoutGoal, WorkoutPlan, WorkoutPlanVersion, WorkoutSetLog } from "@/types";

const goals: WorkoutGoal[] = ["cut", "maintain", "bulk"];
const experienceLevels: WorkoutExperience[] = ["beginner", "intermediate", "advanced"];
const equipmentOptions: WorkoutEquipment[] = ["bodyweight", "dumbbells", "full_gym"];

export function WorkoutPlannerPanel() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [goal, setGoal] = useState<WorkoutGoal>("maintain");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [experienceLevel, setExperienceLevel] = useState<WorkoutExperience>("intermediate");
  const [equipment, setEquipment] = useState<WorkoutEquipment>("dumbbells");
  const [sessionMinutes, setSessionMinutes] = useState("60");
  const [seed, setSeed] = useState("");
  const [result, setResult] = useState<WorkoutPlan | null>(null);
  const [editablePlan, setEditablePlan] = useState<WorkoutPlan | null>(null);
  const [planName, setPlanName] = useState("My plan");
  const [planId, setPlanId] = useState<string | null>(null);
  const [planVersions, setPlanVersions] = useState<WorkoutPlanVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [setInputs, setSetInputs] = useState<Record<string, { setNumber: string; reps: string; weightKg: string }>>({});
  const [setLogs, setSetLogs] = useState<Record<string, WorkoutSetLog[]>>({});
  const [savingSetKey, setSavingSetKey] = useState<string | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, WorkoutSetLog[]>>({});
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary";

  useEffect(() => {
    if (!supabase) {
      setSignedIn(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSignedIn(Boolean(data.session));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadLatestPlan() {
      if (!signedIn || planLoading || editablePlan || result) {
        return;
      }

      setPlanLoading(true);

      try {
        const payload = await authedJsonFetch<{ version: WorkoutPlanVersion | null }>("/api/workout-plans?latest=1");
        if (!active) {
          return;
        }

        if (payload.version) {
          setEditablePlan(payload.version.plan);
          setPlanId(payload.version.planId);
          setPlanVersions([payload.version]);
          setPlanName(`Custom plan ${new Date(payload.version.createdAt).toLocaleDateString()}`);
          setIsEditing(false);
        }
      } catch (loadError) {
        if (active) {
          setHistoryError(loadError instanceof Error ? loadError.message : "Unable to load latest plan.");
        }
      } finally {
        if (active) {
          setPlanLoading(false);
        }
      }
    }

    loadLatestPlan();

    return () => {
      active = false;
    };
  }, [editablePlan, planLoading, result, signedIn]);

  useEffect(() => {
    const nextGoal = searchParams.get("goal");
    if (nextGoal && goals.includes(nextGoal as WorkoutGoal)) {
      setGoal(nextGoal as WorkoutGoal);
    }

    const nextDays = Number(searchParams.get("daysPerWeek"));
    if (Number.isFinite(nextDays) && nextDays >= 2 && nextDays <= 6) {
      setDaysPerWeek(String(nextDays));
    }

    const nextExperience = searchParams.get("experienceLevel");
    if (nextExperience && experienceLevels.includes(nextExperience as WorkoutExperience)) {
      setExperienceLevel(nextExperience as WorkoutExperience);
    }

    const nextEquipment = searchParams.get("equipment");
    if (nextEquipment && equipmentOptions.includes(nextEquipment as WorkoutEquipment)) {
      setEquipment(nextEquipment as WorkoutEquipment);
    }

    const nextSessionMinutes = Number(searchParams.get("sessionMinutes"));
    if (Number.isFinite(nextSessionMinutes) && nextSessionMinutes >= 30) {
      setSessionMinutes(String(nextSessionMinutes));
    }

    const nextSeed = searchParams.get("seed");
    if (nextSeed) {
      setSeed(nextSeed);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!result) {
      setSetInputs({});
      setSetLogs({});
      setExerciseProgress({});
      setSelectedExercise(null);
      setProgressError(null);
      setEditablePlan(null);
      setIsEditing(false);
      setPlanId(null);
      setPlanVersions([]);
      setHistoryError(null);
      setSelectedDay(null);
      return;
    }

    if (!isEditing) {
      setPlanName(`${result.splitName} plan`);
    }
  }, [result]);

  useEffect(() => {
    const planSource = editablePlan ?? result;
    if (planSource?.days.length) {
      setSelectedDay((current) => current ?? planSource.days[0].name);
    }
  }, [editablePlan, result]);

  function getSetKey(dayName: string, exerciseName: string): string {
    return `${dayName}-${exerciseName}`;
  }

  function getSetInput(key: string, defaultReps: string) {
    return setInputs[key] ?? { setNumber: "1", reps: defaultReps, weightKg: "" };
  }

  function updateSetInput(key: string, next: { setNumber?: string; reps?: string; weightKg?: string }) {
    setSetInputs((current) => ({
      ...current,
      [key]: {
        setNumber: next.setNumber ?? current[key]?.setNumber ?? "1",
        reps: next.reps ?? current[key]?.reps ?? "",
        weightKg: next.weightKg ?? current[key]?.weightKg ?? ""
      }
    }));
  }

  function clonePlan(plan: WorkoutPlan): WorkoutPlan {
    return {
      ...plan,
      days: plan.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({ ...exercise }))
      }))
    };
  }

  function recalcPlan(plan: WorkoutPlan): WorkoutPlan {
    const totalExercises = plan.days.reduce((total, day) => total + day.exercises.length, 0);
    return {
      ...plan,
      weeklySessions: plan.days.length,
      totalExercises
    };
  }

  function updateEditablePlan(updater: (plan: WorkoutPlan) => WorkoutPlan) {
    setEditablePlan((current) => {
      if (!current) {
        return current;
      }

      const next = updater(clonePlan(current));
      return recalcPlan(next);
    });
  }

  function createBlankPlan(): WorkoutPlan {
    return {
      goal,
      splitName: "Custom plan",
      weeklySessions: 0,
      sessionMinutes: Number(sessionMinutes),
      days: [],
      totalExercises: 0
    };
  }

  function handleStartCustomPlan() {
    setEditablePlan(createBlankPlan());
    setPlanName("My plan");
    setPlanId(null);
    setPlanVersions([]);
    setHistoryError(null);
    setIsEditing(true);
    setSelectedDay(null);
  }

  function handleCustomizeGenerated() {
    if (!result) {
      return;
    }

    setEditablePlan(recalcPlan(clonePlan(result)));
    setPlanName(`${result.splitName} plan`);
    setPlanId(null);
    setPlanVersions([]);
    setHistoryError(null);
    setIsEditing(true);
  }

  function handleAddDay() {
    let nextName = "Day 1";
    updateEditablePlan((plan) => {
      const nextIndex = plan.days.length + 1;
      nextName = `Day ${nextIndex}`;
      plan.days.push({
        name: nextName,
        focus: "full_body",
        exercises: []
      });
      return plan;
    });
    setSelectedDay(nextName);
  }

  function handleRemoveDay(dayName: string) {
    let nextSelected: string | null = selectedDay;
    updateEditablePlan((plan) => {
      plan.days = plan.days.filter((day) => day.name !== dayName);
      if (dayName === selectedDay) {
        nextSelected = plan.days[0]?.name ?? null;
      }
      return plan;
    });
    setSelectedDay(nextSelected ?? null);
  }

  function handleUpdateDay(dayName: string, updates: { name?: string; focus?: WorkoutPlan["days"][number]["focus"] }) {
    let nextSelected = selectedDay;
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) {
        return plan;
      }

      if (updates.name) {
        if (selectedDay === day.name) {
          nextSelected = updates.name;
        }
        day.name = updates.name;
      }

      if (updates.focus) {
        day.focus = updates.focus;
      }

      return plan;
    });

    setSelectedDay(nextSelected ?? null);
  }

  function handleAddExercise(dayName: string) {
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) {
        return plan;
      }

      day.exercises.push({
        name: "New exercise",
        sets: 3,
        reps: "8-12",
        restSeconds: 60,
        equipment: equipment
      });

      return plan;
    });
  }

  function handleRemoveExercise(dayName: string, exerciseName: string, index: number) {
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) {
        return plan;
      }

      day.exercises = day.exercises.filter((exercise, exerciseIndex) => !(exercise.name === exerciseName && exerciseIndex === index));
      return plan;
    });
  }

  function handleUpdateExercise(
    dayName: string,
    index: number,
    updates: Partial<WorkoutPlan["days"][number]["exercises"][number]>
  ) {
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) {
        return plan;
      }

      const exercise = day.exercises[index];
      if (!exercise) {
        return plan;
      }

      Object.assign(exercise, updates);
      return plan;
    });
  }

  async function handleSavePlan() {
    if (!editablePlan) {
      return;
    }

    if (!signedIn) {
      setError("Sign in to save workout plans.");
      return;
    }

    if (!planName.trim()) {
      setError("Plan name is required.");
      return;
    }

    setSavingPlan(true);
    setError(null);

    try {
      const payload = await authedJsonFetch<{ planId: string; version: WorkoutPlanVersion }>("/api/workout-plans", {
        method: "POST",
        body: JSON.stringify({
          planId,
          name: planName.trim(),
          plan: editablePlan,
          source: isEditing ? "custom" : "generated"
        })
      });

      setPlanId(payload.planId);
      setPlanVersions((current) => [payload.version, ...current]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save workout plan.");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleLoadHistory() {
    if (!planId) {
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const payload = await authedJsonFetch<{ versions: WorkoutPlanVersion[] }>(`/api/workout-plans?planId=${planId}`);
      setPlanVersions(payload.versions);
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : "Unable to load plan history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function buildExerciseChartData(logs: WorkoutSetLog[]) {
    const dailyMap = new Map<string, { date: string; maxWeight: number; totalReps: number }>();

    for (const log of logs) {
      const existing = dailyMap.get(log.workoutDate);
      if (!existing) {
        dailyMap.set(log.workoutDate, {
          date: log.workoutDate,
          maxWeight: log.weightKg,
          totalReps: log.reps
        });
        continue;
      }

      existing.maxWeight = Math.max(existing.maxWeight, log.weightKg);
      existing.totalReps += log.reps;
    }

    return [...dailyMap.values()].sort((left, right) => left.date.localeCompare(right.date));
  }

  async function handleSelectExercise(exerciseName: string) {
    setSelectedExercise(exerciseName);
    setProgressError(null);

    if (!signedIn) {
      setProgressError("Sign in to view workout progress.");
      return;
    }

    if (exerciseProgress[exerciseName]) {
      return;
    }

    setProgressLoading(true);

    try {
      const payload = await authedJsonFetch<{ entries: WorkoutSetLog[] }>(
        `/api/workout-logs?exerciseName=${encodeURIComponent(exerciseName)}&limit=200`
      );

      setExerciseProgress((current) => ({
        ...current,
        [exerciseName]: payload.entries
      }));
    } catch (loadError) {
      setProgressError(loadError instanceof Error ? loadError.message : "Unable to load workout progress.");
    } finally {
      setProgressLoading(false);
    }
  }

  async function handleSaveSet(dayName: string, exerciseName: string, defaultReps: string) {
    if (!signedIn) {
      setError("Sign in to save workout logs.");
      return;
    }

    const key = getSetKey(dayName, exerciseName);
    const input = getSetInput(key, defaultReps);
    const setNumber = Number(input.setNumber);
    const reps = Number(input.reps);
    const weightKg = Number(input.weightKg);

    if (!Number.isFinite(setNumber) || setNumber <= 0) {
      setError("Set number must be a positive number.");
      return;
    }

    if (!Number.isFinite(reps) || reps <= 0) {
      setError("Reps must be a positive number.");
      return;
    }

    if (!Number.isFinite(weightKg) || weightKg < 0) {
      setError("Weight must be 0 or greater.");
      return;
    }

    setSavingSetKey(key);
    setError(null);

    try {
      const payload = await authedJsonFetch<{ entry: WorkoutSetLog }>("/api/workout-logs", {
        method: "POST",
        body: JSON.stringify({
          workoutDate: new Date().toISOString().slice(0, 10),
          exerciseName,
          setNumber,
          reps,
          weightKg
        })
      });

      setSetLogs((current) => ({
        ...current,
        [key]: [payload.entry, ...(current[key] ?? [])]
      }));

      setExerciseProgress((current) => {
        if (selectedExercise !== exerciseName) {
          return current;
        }

        return {
          ...current,
          [exerciseName]: [payload.entry, ...(current[exerciseName] ?? [])]
        };
      });

      updateSetInput(key, { setNumber: String(setNumber + 1) });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save workout log.");
    } finally {
      setSavingSetKey(null);
    }
  }

  const exerciseChartData = useMemo(() => {
    if (!selectedExercise) {
      return [] as Array<{ date: string; maxWeight: number; totalReps: number }>;
    }

    return buildExerciseChartData(exerciseProgress[selectedExercise] ?? []);
  }, [exerciseProgress, selectedExercise]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchJson<WorkoutPlan>("/api/workout", {
        method: "POST",
        body: JSON.stringify({
          goal,
          daysPerWeek: Number(daysPerWeek),
          experienceLevel,
          equipment,
          sessionMinutes: Number(sessionMinutes),
          seed: seed.trim().length > 0 ? seed.trim() : undefined
        })
      });

      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to build workout plan.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Workout planner</p>
          <h1 className="mt-2 text-2xl font-semibold text-card-foreground sm:text-3xl">Build a weekly training split</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            The planner picks a split and exercise list based on your goal, schedule, and equipment.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Goal">
              <select value={goal} onChange={(event) => setGoal(event.target.value as WorkoutGoal)} className={inputClass}>
                {goals.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Experience level">
              <select
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value as WorkoutExperience)}
                className={inputClass}
              >
                {experienceLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Days per week">
              <input value={daysPerWeek} onChange={(event) => setDaysPerWeek(event.target.value)} type="number" min="2" max="6" className={inputClass} />
            </Field>
            <Field label="Session length (minutes)">
              <input
                value={sessionMinutes}
                onChange={(event) => setSessionMinutes(event.target.value)}
                type="number"
                min="30"
                max="120"
                className={inputClass}
              />
            </Field>
            <Field label="Equipment">
              <select value={equipment} onChange={(event) => setEquipment(event.target.value as WorkoutEquipment)} className={inputClass}>
                {equipmentOptions.map((item) => (
                  <option key={item} value={item}>
                    {item.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Seed (optional)">
              <input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="Use to repeat a plan" className={inputClass} />
            </Field>

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {loading ? "Building..." : "Build workout plan"}
              </button>
              <button
                type="button"
                onClick={handleStartCustomPlan}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                Create custom plan
              </button>
            </div>
          </form>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {!signedIn ? <p className="mt-2 text-sm text-muted-foreground">Sign in to save workout logs.</p> : null}

          {(editablePlan ?? result) ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={planName}
                    onChange={(event) => setPlanName(event.target.value)}
                    disabled={!isEditing}
                    className={
                      isEditing
                        ? "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground"
                        : "w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
                    }
                  />
                  {!isEditing && editablePlan ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Edit plan
                    </button>
                  ) : null}
                  {!isEditing && !editablePlan && result ? (
                    <button
                      type="button"
                      onClick={handleCustomizeGenerated}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Customize plan
                    </button>
                  ) : null}
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Done
                    </button>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSavePlan}
                      disabled={savingPlan}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      {savingPlan ? "Saving..." : "Save plan"}
                    </button>
                    {planId ? (
                      <button
                        type="button"
                        onClick={handleLoadHistory}
                        disabled={historyLoading}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                      >
                        {historyLoading ? "Loading..." : "View history"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {historyError ? <p className="text-sm text-red-400">{historyError}</p> : null}
              {planVersions.length > 0 ? (
                <div className="rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground">
                  Latest versions: {planVersions.slice(0, 3).map((version) => new Date(version.createdAt).toLocaleDateString()).join(" · ")}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Split" value={(editablePlan ?? result)!.splitName} />
                <Stat label="Sessions" value={`${(editablePlan ?? result)!.weeklySessions} / week`} />
                <Stat label="Exercises" value={`${(editablePlan ?? result)!.totalExercises} total`} />
                <Stat label="Session length" value={`${(editablePlan ?? result)!.sessionMinutes} min`} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
                <aside className="rounded-2xl border border-border bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workout days</p>
                  <div className="mt-3 space-y-2">
                    {(editablePlan ?? result)!.days.map((day) => (
                      <button
                        key={day.name}
                        type="button"
                        onClick={() => setSelectedDay(day.name)}
                        className={
                          selectedDay === day.name
                            ? "w-full rounded-xl border border-primary bg-primary/10 px-3 py-3 text-left text-sm font-semibold text-primary"
                            : "w-full rounded-xl border border-border bg-card px-3 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                        }
                      >
                        <p className="text-sm font-semibold">{day.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em]">{day.focus.replace("_", " ")}</p>
                      </button>
                    ))}
                  </div>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handleAddDay}
                      className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Add day
                    </button>
                  ) : null}
                </aside>

                <section className="rounded-2xl border border-border bg-background/50 p-4">
                  {selectedDay ? (
                    (editablePlan ?? result)!.days
                      .filter((day) => day.name === selectedDay)
                      .map((day) => (
                        <div key={day.name}>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              {isEditing ? (
                                <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr]">
                                  <input
                                    value={day.name}
                                    onChange={(event) => handleUpdateDay(day.name, { name: event.target.value })}
                                    className={inputClass}
                                    placeholder="Day name"
                                  />
                                  <select
                                    value={day.focus}
                                    onChange={(event) => handleUpdateDay(day.name, { focus: event.target.value as WorkoutPlan["days"][number]["focus"] })}
                                    className={inputClass}
                                  >
                                    <option value="full_body">Full body</option>
                                    <option value="upper">Upper</option>
                                    <option value="lower">Lower</option>
                                    <option value="push">Push</option>
                                    <option value="pull">Pull</option>
                                    <option value="legs">Legs</option>
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
                              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{(editablePlan ?? result)!.goal}</span>
                              {isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDay(day.name)}
                                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {day.exercises.map((exercise, index) => {
                              const key = getSetKey(day.name, exercise.name);
                              const input = getSetInput(key, exercise.reps);
                              const logs = setLogs[key] ?? [];

                              if (isEditing) {
                                return (
                                  <div key={`${day.name}-${index}`} className="rounded-xl border border-border bg-card px-3 py-3 text-sm">
                                    <div className="grid gap-2 sm:grid-cols-[1.6fr_0.6fr_0.6fr_0.6fr_1fr_auto]">
                                      <input
                                        value={exercise.name}
                                        onChange={(event) => handleUpdateExercise(day.name, index, { name: event.target.value })}
                                        className={inputClass}
                                        placeholder="Exercise name"
                                      />
                                      <input
                                        value={exercise.sets}
                                        onChange={(event) => handleUpdateExercise(day.name, index, { sets: Number(event.target.value) })}
                                        type="number"
                                        min="1"
                                        className={inputClass}
                                        placeholder="Sets"
                                      />
                                      <input
                                        value={exercise.reps}
                                        onChange={(event) => handleUpdateExercise(day.name, index, { reps: event.target.value })}
                                        className={inputClass}
                                        placeholder="Reps"
                                      />
                                      <input
                                        value={exercise.restSeconds}
                                        onChange={(event) => handleUpdateExercise(day.name, index, { restSeconds: Number(event.target.value) })}
                                        type="number"
                                        min="0"
                                        className={inputClass}
                                        placeholder="Rest"
                                      />
                                      <select
                                        value={exercise.equipment}
                                        onChange={(event) => handleUpdateExercise(day.name, index, { equipment: event.target.value as WorkoutEquipment })}
                                        className={inputClass}
                                      >
                                        <option value="bodyweight">Bodyweight</option>
                                        <option value="dumbbells">Dumbbells</option>
                                        <option value="full_gym">Full gym</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveExercise(day.name, exercise.name, index)}
                                        className="rounded-xl border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={key} className="rounded-xl border border-border bg-card px-3 py-3 text-sm">
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <p className="text-card-foreground">{exercise.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {exercise.sets} sets · {exercise.reps} reps · {exercise.restSeconds}s rest
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectExercise(exercise.name)}
                                        className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                                      >
                                        View progress
                                      </button>
                                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        {exercise.equipment.replace("_", " ")}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                                    <input
                                      value={input.setNumber}
                                      onChange={(event) => updateSetInput(key, { setNumber: event.target.value })}
                                      type="number"
                                      min="1"
                                      className={inputClass}
                                      placeholder="Set"
                                    />
                                    <input
                                      value={input.reps}
                                      onChange={(event) => updateSetInput(key, { reps: event.target.value })}
                                      type="number"
                                      min="1"
                                      className={inputClass}
                                      placeholder="Reps"
                                    />
                                    <input
                                      value={input.weightKg}
                                      onChange={(event) => updateSetInput(key, { weightKg: event.target.value })}
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      className={inputClass}
                                      placeholder="Weight (kg)"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSet(day.name, exercise.name, exercise.reps)}
                                      disabled={!signedIn || savingSetKey === key}
                                      className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {savingSetKey === key ? "Saving..." : "Save set"}
                                    </button>
                                  </div>

                                  {logs.length > 0 ? (
                                    <div className="mt-3 space-y-2">
                                      {logs.slice(0, 3).map((log) => (
                                        <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
                                          <span>{`Set ${log.setNumber} · ${log.reps} reps`}</span>
                                          <span className="text-muted-foreground">{`${log.weightKg} kg`}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}

                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => handleAddExercise(day.name)}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                              >
                                Add exercise
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-sm text-muted-foreground">
                      Select a workout day to view exercises.
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}

          {selectedExercise ? (
            <div className="mt-6 rounded-3xl border border-border bg-background/50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">Progress for {selectedExercise}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Showing your top weight per training day.</p>
                </div>
                {progressLoading ? (
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading</span>
                ) : null}
              </div>

              {progressError ? <p className="mt-3 text-sm text-red-400">{progressError}</p> : null}

              <div className="mt-5 h-64">
                {!signedIn ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                    Sign in to view workout progress.
                  </div>
                ) : exerciseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exerciseChartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 16,
                          color: "#e2e8f0"
                        }}
                      />
                      <Line type="monotone" dataKey="maxWeight" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#0f172a" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                    Log sets for this exercise to see progress.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
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
