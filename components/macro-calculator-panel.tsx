"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { authedJsonFetch, fetchJson } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import type { ActivityLevel, Goal, MacroPlanVersion, MacroTargets } from "@/types";

type MacroResponse = MacroTargets;

const goals: Goal[] = ["cut", "maintain", "bulk"];
const activityLevels: ActivityLevel[] = ["sedentary", "light", "moderate", "active"];

export function MacroCalculatorPanel() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [weightKg, setWeightKg] = useState("72");
  const [bodyFatPercent, setBodyFatPercent] = useState("18");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [result, setResult] = useState<MacroResponse | null>(null);
  const [editableMacro, setEditableMacro] = useState<MacroTargets | null>(null);
  const [planName, setPlanName] = useState("My macro target");
  const [planId, setPlanId] = useState<string | null>(null);
  const [planVersions, setPlanVersions] = useState<MacroPlanVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
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
    if (!result) {
      setEditableMacro(null);
      setIsEditing(false);
      setPlanId(null);
      setPlanVersions([]);
      setHistoryError(null);
      return;
    }

    if (!isEditing) {
      setPlanName("My macro target");
    }
  }, [isEditing, result]);

  useEffect(() => {
    let active = true;

    async function loadLatestPlan() {
      if (!signedIn || planLoading || editableMacro || result) {
        return;
      }

      setPlanLoading(true);

      try {
        const payload = await authedJsonFetch<{ version: MacroPlanVersion | null }>("/api/macro-plans?latest=1");
        if (!active) {
          return;
        }

        if (payload.version) {
          setEditableMacro(payload.version.plan);
          setPlanId(payload.version.planId);
          setPlanVersions([payload.version]);
          setPlanName(`Macro target ${new Date(payload.version.createdAt).toLocaleDateString()}`);
          setIsEditing(false);
        }
      } catch (loadError) {
        if (active) {
          setHistoryError(loadError instanceof Error ? loadError.message : "Unable to load macro plan.");
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
  }, [editableMacro, planLoading, result, signedIn]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchJson<MacroResponse>("/api/macro", {
        method: "POST",
        body: JSON.stringify({
          weightKg: Number(weightKg),
          bodyFatPercent: Number(bodyFatPercent),
          goal,
          activityLevel
        })
      });

      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate macros.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomizeTarget() {
    if (!result) {
      return;
    }

    setEditableMacro({ ...result, targetCalories: result.calories });
    setPlanId(null);
    setPlanVersions([]);
    setHistoryError(null);
    setIsEditing(true);
  }

  function handleCreateCustomTarget() {
    const calories = 2000;
    setEditableMacro({
      leanBodyMassKg: 0,
      bmrCalories: calories,
      targetCalories: calories,
      calories,
      proteinGrams: 150,
      carbsGrams: 200,
      fatGrams: 60
    });
    setPlanName("My macro target");
    setPlanId(null);
    setPlanVersions([]);
    setHistoryError(null);
    setIsEditing(true);
  }

  function updateEditableMacro(updates: Partial<MacroTargets>) {
    setEditableMacro((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, ...updates };
      next.targetCalories = next.calories;
      return next;
    });
  }

  async function handleSavePlan() {
    if (!editableMacro) {
      return;
    }

    if (!signedIn) {
      setError("Sign in to save macro targets.");
      return;
    }

    if (!planName.trim()) {
      setError("Plan name is required.");
      return;
    }

    setSavingPlan(true);
    setError(null);

    try {
      const payload = await authedJsonFetch<{ planId: string; version: MacroPlanVersion }>("/api/macro-plans", {
        method: "POST",
        body: JSON.stringify({
          planId,
          name: planName.trim(),
          plan: editableMacro,
          source: isEditing ? "custom" : "generated"
        })
      });

      setPlanId(payload.planId);
      setPlanVersions((current) => [payload.version, ...current]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save macro plan.");
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
      const payload = await authedJsonFetch<{ versions: MacroPlanVersion[] }>(`/api/macro-plans?planId=${planId}`);
      setPlanVersions(payload.versions);
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : "Unable to load macro history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  const mealPlannerHref = useMemo(() => {
    if (!result) {
      return "/meal";
    }

    const params = new URLSearchParams({
      calories: String(result.calories),
      proteinGrams: String(result.proteinGrams),
      carbsGrams: String(result.carbsGrams),
      fatGrams: String(result.fatGrams),
      goal
    });

    return `/meal?${params.toString()}`;
  }, [goal, result]);

  const workoutPlannerHref = useMemo(() => {
    const params = new URLSearchParams({
      goal,
      daysPerWeek: "4",
      equipment: "dumbbells"
    });
    return `/workout?${params.toString()}`;
  }, [goal]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Macro calculator</p>
          <h1 className="mt-2 text-2xl font-semibold text-card-foreground sm:text-3xl">Calculate your targets from body composition</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Results are generated by the backend and can be sent directly to the meal planner.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Weight (kg)">
              <input value={weightKg} onChange={(event) => setWeightKg(event.target.value)} type="number" step="0.1" min="0" className={inputClass} />
            </Field>
            <Field label="Body fat %">
              <input value={bodyFatPercent} onChange={(event) => setBodyFatPercent(event.target.value)} type="number" step="0.1" min="0" max="100" className={inputClass} />
            </Field>
            <Field label="Goal">
              <select value={goal} onChange={(event) => setGoal(event.target.value as Goal)} className={inputClass}>
                {goals.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Activity level">
                <select value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)} className={inputClass}>
                {activityLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {loading ? "Calculating..." : "Calculate macros"}
              </button>
              <Link href={mealPlannerHref} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
                Send to meal planner
              </Link>
              <Link href={workoutPlannerHref} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
                Send to workout planner
              </Link>
              <button
                type="button"
                onClick={handleCreateCustomTarget}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                Create custom target
              </button>
            </div>
          </form>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {!signedIn ? <p className="mt-2 text-sm text-muted-foreground">Sign in to save macro targets.</p> : null}
          {historyError ? <p className="mt-2 text-sm text-red-400">{historyError}</p> : null}

          {(editableMacro ?? result) ? (
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
                  {!isEditing && editableMacro ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Edit target
                    </button>
                  ) : null}
                  {!isEditing && !editableMacro && result ? (
                    <button
                      type="button"
                      onClick={handleCustomizeTarget}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Customize target
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
                      {savingPlan ? "Saving..." : "Save target"}
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

              {planVersions.length > 0 ? (
                <div className="rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground">
                  Latest versions: {planVersions.slice(0, 3).map((version) => new Date(version.createdAt).toLocaleDateString()).join(" · ")}
                </div>
              ) : null}

              {isEditing && editableMacro ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Calories">
                    <input
                      value={editableMacro.calories}
                      onChange={(event) => updateEditableMacro({ calories: Number(event.target.value) })}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Protein (g)">
                    <input
                      value={editableMacro.proteinGrams}
                      onChange={(event) => updateEditableMacro({ proteinGrams: Number(event.target.value) })}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Carbs (g)">
                    <input
                      value={editableMacro.carbsGrams}
                      onChange={(event) => updateEditableMacro({ carbsGrams: Number(event.target.value) })}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Fat (g)">
                    <input
                      value={editableMacro.fatGrams}
                      onChange={(event) => updateEditableMacro({ fatGrams: Number(event.target.value) })}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Stat label="LBM" value={`${(editableMacro ?? result)!.leanBodyMassKg.toFixed(1)} kg`} />
                  <Stat label="Calories" value={`${(editableMacro ?? result)!.calories} kcal`} />
                  <Stat label="Protein" value={`${(editableMacro ?? result)!.proteinGrams} g`} />
                  <Stat label="Carbs" value={`${(editableMacro ?? result)!.carbsGrams} g`} />
                  <Stat label="Fat" value={`${(editableMacro ?? result)!.fatGrams} g`} />
                  <Stat label="BMR" value={`${(editableMacro ?? result)!.bmrCalories} kcal`} />
                </div>
              )}
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
