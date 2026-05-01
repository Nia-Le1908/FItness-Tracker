"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { authedJsonFetch, fetchJson } from "@/lib/api/client";
import { vietnameseFoods } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import type { MealPlanResult, MealMacroTargets, MealPlanSnapshot, MealPlanVersion } from "@/types";

type MealResponse = MealPlanResult;

export function MealPlannerPanel() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [budgetVnd, setBudgetVnd] = useState("90000");
  const [calories, setCalories] = useState("2100");
  const [proteinGrams, setProteinGrams] = useState("150");
  const [carbsGrams, setCarbsGrams] = useState("220");
  const [fatGrams, setFatGrams] = useState("55");
  const [result, setResult] = useState<MealResponse | null>(null);
  const [editableSnapshot, setEditableSnapshot] = useState<MealPlanSnapshot | null>(null);
  const [planName, setPlanName] = useState("My meal plan");
  const [planId, setPlanId] = useState<string | null>(null);
  const [planVersions, setPlanVersions] = useState<MealPlanVersion[]>([]);
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
    const nextCalories = searchParams.get("calories");
    const nextProtein = searchParams.get("proteinGrams");
    const nextCarbs = searchParams.get("carbsGrams");
    const nextFat = searchParams.get("fatGrams");

    if (nextCalories) setCalories(nextCalories);
    if (nextProtein) setProteinGrams(nextProtein);
    if (nextCarbs) setCarbsGrams(nextCarbs);
    if (nextFat) setFatGrams(nextFat);
  }, [searchParams]);

  useEffect(() => {
    if (!result) {
      setEditableSnapshot(null);
      setIsEditing(false);
      setPlanId(null);
      setPlanVersions([]);
      setHistoryError(null);
      return;
    }

    if (!isEditing) {
      setPlanName("My meal plan");
    }
  }, [isEditing, result]);

  useEffect(() => {
    let active = true;

    async function loadLatestPlan() {
      if (!signedIn || planLoading || editableSnapshot || result) {
        return;
      }

      setPlanLoading(true);

      try {
        const payload = await authedJsonFetch<{ version: MealPlanVersion | null }>("/api/meal-plans?latest=1");
        if (!active) {
          return;
        }

        if (payload.version) {
          setEditableSnapshot(payload.version.snapshot);
          setPlanId(payload.version.planId);
          setPlanVersions([payload.version]);
          setPlanName(`Meal plan ${new Date(payload.version.createdAt).toLocaleDateString()}`);
          setIsEditing(false);
          setBudgetVnd(String(payload.version.snapshot.budgetVnd));
          setCalories(String(payload.version.snapshot.targetMacros.calories));
          setProteinGrams(String(payload.version.snapshot.targetMacros.proteinGrams));
          setCarbsGrams(String(payload.version.snapshot.targetMacros.carbsGrams));
          setFatGrams(String(payload.version.snapshot.targetMacros.fatGrams));
        }
      } catch (loadError) {
        if (active) {
          setHistoryError(loadError instanceof Error ? loadError.message : "Unable to load meal plan.");
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
  }, [editableSnapshot, planLoading, result, signedIn]);

  const targetMacros = useMemo<MealMacroTargets>(
    () => ({
      calories: Number(calories),
      proteinGrams: Number(proteinGrams),
      carbsGrams: Number(carbsGrams),
      fatGrams: Number(fatGrams)
    }),
    [calories, proteinGrams, carbsGrams, fatGrams]
  );

  function cloneSnapshot(snapshot: MealPlanSnapshot): MealPlanSnapshot {
    return {
      budgetVnd: snapshot.budgetVnd,
      targetMacros: { ...snapshot.targetMacros },
      plan: {
        ...snapshot.plan,
        meals: snapshot.plan.meals.map((meal) => ({
          ...meal,
          entries: meal.entries.map((entry) => ({ ...entry }))
        }))
      }
    };
  }

  function recalcSnapshot(snapshot: MealPlanSnapshot): MealPlanSnapshot {
    const total = snapshot.plan.meals.reduce(
      (acc, meal) => {
        acc.totalCalories += meal.calories;
        acc.totalProteinGrams += meal.proteinGrams;
        acc.totalCarbsGrams += meal.carbsGrams;
        acc.totalFatGrams += meal.fatGrams;
        acc.totalCostVnd += meal.costVnd;
        return acc;
      },
      { totalCalories: 0, totalProteinGrams: 0, totalCarbsGrams: 0, totalFatGrams: 0, totalCostVnd: 0 }
    );

    const plan = {
      ...snapshot.plan,
      ...total,
      withinBudget: total.totalCostVnd <= snapshot.budgetVnd,
      withinMacroTargets:
        total.totalCalories >= snapshot.targetMacros.calories * 0.9 &&
        total.totalCalories <= snapshot.targetMacros.calories * 1.1 &&
        total.totalProteinGrams >= snapshot.targetMacros.proteinGrams * 0.9 &&
        total.totalProteinGrams <= snapshot.targetMacros.proteinGrams * 1.1 &&
        total.totalCarbsGrams >= snapshot.targetMacros.carbsGrams * 0.9 &&
        total.totalCarbsGrams <= snapshot.targetMacros.carbsGrams * 1.1 &&
        total.totalFatGrams >= snapshot.targetMacros.fatGrams * 0.9 &&
        total.totalFatGrams <= snapshot.targetMacros.fatGrams * 1.1
    };

    return {
      ...snapshot,
      plan
    };
  }

  function updateEditableSnapshot(updater: (snapshot: MealPlanSnapshot) => MealPlanSnapshot) {
    setEditableSnapshot((current) => {
      if (!current) {
        return current;
      }

      const next = updater(cloneSnapshot(current));
      return recalcSnapshot(next);
    });
  }

  function handleCustomizePlan() {
    if (!result) {
      return;
    }

    const snapshot: MealPlanSnapshot = {
      budgetVnd: Number(budgetVnd),
      targetMacros,
      plan: result
    };

    setEditableSnapshot(recalcSnapshot(snapshot));
    setPlanId(null);
    setPlanVersions([]);
    setHistoryError(null);
    setIsEditing(true);
  }

  function handleCreateCustomPlan() {
    const emptySnapshot: MealPlanSnapshot = {
      budgetVnd: Number(budgetVnd),
      targetMacros,
      plan: {
        meals: [],
        totalCalories: 0,
        totalProteinGrams: 0,
        totalCarbsGrams: 0,
        totalFatGrams: 0,
        totalCostVnd: 0,
        withinBudget: true,
        withinMacroTargets: false
      }
    };

    setEditableSnapshot(emptySnapshot);
    setPlanName("My meal plan");
    setPlanId(null);
    setPlanVersions([]);
    setHistoryError(null);
    setIsEditing(true);
  }

  function handleAddMeal() {
    updateEditableSnapshot((snapshot) => {
      const nextIndex = snapshot.plan.meals.length + 1;
      snapshot.plan.meals.push({
        name: `Meal ${nextIndex}`,
        entries: [],
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        costVnd: 0
      });
      return snapshot;
    });
  }

  function handleRemoveMeal(index: number) {
    updateEditableSnapshot((snapshot) => {
      snapshot.plan.meals.splice(index, 1);
      return snapshot;
    });
  }

  function handleUpdateMealName(index: number, name: string) {
    updateEditableSnapshot((snapshot) => {
      const meal = snapshot.plan.meals[index];
      if (meal) {
        meal.name = name;
      }
      return snapshot;
    });
  }

  function handleAddEntry(mealIndex: number) {
    updateEditableSnapshot((snapshot) => {
      const meal = snapshot.plan.meals[mealIndex];
      if (!meal) {
        return snapshot;
      }

      meal.entries.push({
        foodId: `custom-${meal.entries.length + 1}`,
        foodName: "New item",
        grams: 100,
        calories: 0,
        costVnd: 0
      });
      return snapshot;
    });
  }

  function handleRemoveEntry(mealIndex: number, entryIndex: number) {
    updateEditableSnapshot((snapshot) => {
      const meal = snapshot.plan.meals[mealIndex];
      if (!meal) {
        return snapshot;
      }

      meal.entries.splice(entryIndex, 1);
      meal.calories = meal.entries.reduce((total, entry) => total + entry.calories, 0);
      meal.costVnd = meal.entries.reduce((total, entry) => total + entry.costVnd, 0);
      return snapshot;
    });
  }

  function handleUpdateEntry(
    mealIndex: number,
    entryIndex: number,
    updates: { foodName?: string; grams?: number; calories?: number; costVnd?: number }
  ) {
    updateEditableSnapshot((snapshot) => {
      const meal = snapshot.plan.meals[mealIndex];
      if (!meal) {
        return snapshot;
      }

      const entry = meal.entries[entryIndex];
      if (!entry) {
        return snapshot;
      }

      const grams = updates.grams ?? entry.grams;
      const caloriesPerGram = entry.grams > 0 ? entry.calories / entry.grams : 0;
      const costPerGram = entry.grams > 0 ? entry.costVnd / entry.grams : 0;

      entry.foodName = updates.foodName ?? entry.foodName;
      entry.grams = grams;
      entry.calories = updates.calories ?? Math.round(grams * caloriesPerGram);
      entry.costVnd = updates.costVnd ?? Math.round(grams * costPerGram);

      meal.calories = meal.entries.reduce((total, item) => total + item.calories, 0);
      meal.costVnd = meal.entries.reduce((total, item) => total + item.costVnd, 0);
      return snapshot;
    });
  }

  async function handleSavePlan() {
    if (!editableSnapshot) {
      return;
    }

    if (!signedIn) {
      setError("Sign in to save meal plans.");
      return;
    }

    if (!planName.trim()) {
      setError("Plan name is required.");
      return;
    }

    setSavingPlan(true);
    setError(null);

    try {
      const payload = await authedJsonFetch<{ planId: string; version: MealPlanVersion }>("/api/meal-plans", {
        method: "POST",
        body: JSON.stringify({
          planId,
          name: planName.trim(),
          budgetVnd: editableSnapshot.budgetVnd,
          targetMacros: editableSnapshot.targetMacros,
          plan: editableSnapshot.plan,
          source: isEditing ? "custom" : "generated"
        })
      });

      setPlanId(payload.planId);
      setPlanVersions((current) => [payload.version, ...current]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save meal plan.");
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
      const payload = await authedJsonFetch<{ versions: MealPlanVersion[] }>(`/api/meal-plans?planId=${planId}`);
      setPlanVersions(payload.versions);
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : "Unable to load meal history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  const workoutPlannerHref = useMemo(() => {
    const params = new URLSearchParams({
      daysPerWeek: "4",
      equipment: "dumbbells"
    });

    const goalParam = searchParams.get("goal");
    if (goalParam) {
      params.set("goal", goalParam);
    }

    return `/workout?${params.toString()}`;
  }, [searchParams]);

  const planSource = editableSnapshot ?? (result ? { plan: result } : null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchJson<MealResponse>("/api/meal", {
        method: "POST",
        body: JSON.stringify({
          budgetVnd: Number(budgetVnd),
          ...targetMacros,
          foods: vietnameseFoods
        })
      });

      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to generate meal plan.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Meal planner</p>
          <h1 className="mt-2 text-2xl font-semibold text-card-foreground sm:text-3xl">Generate a budget-friendly meal plan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            The backend turns your macro targets and budget into 3-5 meals using the Vietnamese food catalog.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Budget / day (VND)">
              <input value={budgetVnd} onChange={(event) => setBudgetVnd(event.target.value)} type="number" min="0" className={inputClass} />
            </Field>
            <Field label="Calories">
              <input value={calories} onChange={(event) => setCalories(event.target.value)} type="number" min="0" className={inputClass} />
            </Field>
            <Field label="Protein (g)">
              <input value={proteinGrams} onChange={(event) => setProteinGrams(event.target.value)} type="number" min="0" className={inputClass} />
            </Field>
            <Field label="Carbs (g)">
              <input value={carbsGrams} onChange={(event) => setCarbsGrams(event.target.value)} type="number" min="0" className={inputClass} />
            </Field>
            <Field label="Fat (g)">
              <input value={fatGrams} onChange={(event) => setFatGrams(event.target.value)} type="number" min="0" className={inputClass} />
            </Field>

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {loading ? "Generating..." : "Generate meal plan"}
              </button>
              <Link href={workoutPlannerHref} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
                Send to workout planner
              </Link>
              <button
                type="button"
                onClick={handleCreateCustomPlan}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                Create custom plan
              </button>
            </div>
          </form>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {!signedIn ? <p className="mt-2 text-sm text-muted-foreground">Sign in to save meal plans.</p> : null}
          {historyError ? <p className="mt-2 text-sm text-red-400">{historyError}</p> : null}

          {planSource ? (
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
                  {!isEditing && editableSnapshot ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                    >
                      Edit plan
                    </button>
                  ) : null}
                  {!isEditing && !editableSnapshot && result ? (
                    <button
                      type="button"
                      onClick={handleCustomizePlan}
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

              {planVersions.length > 0 ? (
                <div className="rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground">
                  Latest versions: {planVersions.slice(0, 3).map((version) => new Date(version.createdAt).toLocaleDateString()).join(" · ")}
                </div>
              ) : null}

              {isEditing && editableSnapshot ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="Budget / day (VND)">
                    <input
                      value={editableSnapshot.budgetVnd}
                      onChange={(event) => updateEditableSnapshot((snapshot) => ({
                        ...snapshot,
                        budgetVnd: Number(event.target.value)
                      }))}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Calories">
                    <input
                      value={editableSnapshot.targetMacros.calories}
                      onChange={(event) => updateEditableSnapshot((snapshot) => ({
                        ...snapshot,
                        targetMacros: { ...snapshot.targetMacros, calories: Number(event.target.value) }
                      }))}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Protein (g)">
                    <input
                      value={editableSnapshot.targetMacros.proteinGrams}
                      onChange={(event) => updateEditableSnapshot((snapshot) => ({
                        ...snapshot,
                        targetMacros: { ...snapshot.targetMacros, proteinGrams: Number(event.target.value) }
                      }))}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Carbs (g)">
                    <input
                      value={editableSnapshot.targetMacros.carbsGrams}
                      onChange={(event) => updateEditableSnapshot((snapshot) => ({
                        ...snapshot,
                        targetMacros: { ...snapshot.targetMacros, carbsGrams: Number(event.target.value) }
                      }))}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Fat (g)">
                    <input
                      value={editableSnapshot.targetMacros.fatGrams}
                      onChange={(event) => updateEditableSnapshot((snapshot) => ({
                        ...snapshot,
                        targetMacros: { ...snapshot.targetMacros, fatGrams: Number(event.target.value) }
                      }))}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </Field>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Calories" value={`${planSource.plan.totalCalories} kcal`} />
                <Stat label="Protein" value={`${planSource.plan.totalProteinGrams.toFixed(1)} g`} />
                <Stat label="Carbs" value={`${planSource.plan.totalCarbsGrams.toFixed(1)} g`} />
                <Stat label="Fat" value={`${planSource.plan.totalFatGrams.toFixed(1)} g`} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {planSource.plan.meals.map((meal, mealIndex) => (
                  <article key={`${meal.name}-${mealIndex}`} className="rounded-2xl border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {isEditing && editableSnapshot ? (
                          <input
                            value={meal.name}
                            onChange={(event) => handleUpdateMealName(mealIndex, event.target.value)}
                            className={inputClass}
                          />
                        ) : (
                          <>
                            <h2 className="text-base font-semibold text-card-foreground">{meal.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{meal.calories} kcal · {meal.costVnd.toLocaleString()} VND</p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={meal.costVnd <= Number(budgetVnd) ? "text-primary" : "text-red-400"}>
                          {meal.costVnd.toLocaleString()} VND
                        </span>
                        {isEditing && editableSnapshot ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveMeal(mealIndex)}
                            className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                          >
                            Remove meal
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {meal.entries.map((entry, entryIndex) => (
                        <div key={`${meal.name}-${entry.foodId}-${entryIndex}`} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                          {isEditing && editableSnapshot ? (
                            <div className="grid gap-2 sm:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr_auto]">
                              <input
                                value={entry.foodName}
                                onChange={(event) => handleUpdateEntry(mealIndex, entryIndex, { foodName: event.target.value })}
                                className={inputClass}
                              />
                              <input
                                value={entry.grams}
                                onChange={(event) => handleUpdateEntry(mealIndex, entryIndex, { grams: Number(event.target.value) })}
                                type="number"
                                min="0"
                                className={inputClass}
                              />
                              <input
                                value={entry.calories}
                                onChange={(event) => handleUpdateEntry(mealIndex, entryIndex, { calories: Number(event.target.value) })}
                                type="number"
                                min="0"
                                className={inputClass}
                              />
                              <input
                                value={entry.costVnd}
                                onChange={(event) => handleUpdateEntry(mealIndex, entryIndex, { costVnd: Number(event.target.value) })}
                                type="number"
                                min="0"
                                className={inputClass}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveEntry(mealIndex, entryIndex)}
                                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-card-foreground">{entry.foodName}</span>
                              <span className="text-muted-foreground">{entry.grams}g</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {isEditing && editableSnapshot ? (
                      <button
                        type="button"
                        onClick={() => handleAddEntry(mealIndex)}
                        className="mt-3 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                      >
                        Add item
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>

              {isEditing && editableSnapshot ? (
                <button
                  type="button"
                  onClick={handleAddMeal}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                >
                  Add meal
                </button>
              ) : null}

              <div className="rounded-2xl border border-border bg-background/55 p-4 text-sm">
                <p className={planSource.plan.withinBudget ? "text-primary" : "text-red-400"}>
                  {planSource.plan.withinBudget ? "Within budget" : "Over budget"}
                </p>
                <p className={planSource.plan.withinMacroTargets ? "mt-1 text-primary" : "mt-1 text-muted-foreground"}>
                  {planSource.plan.withinMacroTargets ? "Within macro target window" : "Outside the 10% macro window"}
                </p>
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
