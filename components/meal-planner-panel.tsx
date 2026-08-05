"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { authedJsonFetch, fetchJson } from "@/lib/api/client";
import { vietnameseFoods } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import { useUiFeedback } from "@/lib/ui-feedback";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { MealPlanResult, MealMacroTargets, MealPlanSnapshot, MealPlanVersion } from "@/types";

type MealResponse = MealPlanResult;

export function MealPlannerPanel() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { pushNotice, setBanner } = useUiFeedback();
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
  const { profile, loading: profileLoading } = useUserProfile();
  const [budgetPrefilled, setBudgetPrefilled] = useState(false);
  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary";

  useEffect(() => {
    if (!supabase) {
      setSignedIn(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (budgetPrefilled || profileLoading || !profile.dailyBudgetVnd) return;
    setBudgetVnd(String(profile.dailyBudgetVnd));
    setBudgetPrefilled(true);
  }, [budgetPrefilled, profileLoading, profile.dailyBudgetVnd]);

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
        if (!active) return;

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
        const message = loadError instanceof Error ? loadError.message : "Unable to load meal plan.";
        if (active) setHistoryError(message);
        pushNotice({ title: "Meal history error", message, tone: "error" });
        setBanner({ title: "Meal history error", message, tone: "error" });
      } finally {
        if (active) setPlanLoading(false);
      }
    }

    loadLatestPlan();

    return () => {
      active = false;
    };
  }, [editableSnapshot, planLoading, result, signedIn, pushNotice, setBanner]);

  const targetMacros = useMemo<MealMacroTargets>(() => ({ calories: Number(calories), proteinGrams: Number(proteinGrams), carbsGrams: Number(carbsGrams), fatGrams: Number(fatGrams) }), [calories, proteinGrams, carbsGrams, fatGrams]);

  function cloneSnapshot(snapshot: MealPlanSnapshot): MealPlanSnapshot { return { budgetVnd: snapshot.budgetVnd, targetMacros: { ...snapshot.targetMacros }, plan: { ...snapshot.plan, meals: snapshot.plan.meals.map((meal) => ({ ...meal, entries: meal.entries.map((entry) => ({ ...entry })) })) } }; }
  function recalcMeal(meal: MealPlanSnapshot["plan"]["meals"][number]) { meal.calories = meal.entries.reduce((total, entry) => total + entry.calories, 0); meal.proteinGrams = meal.entries.reduce((total, entry) => total + (entry.proteinGrams ?? 0), 0); meal.carbsGrams = meal.entries.reduce((total, entry) => total + (entry.carbsGrams ?? 0), 0); meal.fatGrams = meal.entries.reduce((total, entry) => total + (entry.fatGrams ?? 0), 0); meal.costVnd = meal.entries.reduce((total, entry) => total + entry.costVnd, 0); }
  function recalcSnapshot(snapshot: MealPlanSnapshot): MealPlanSnapshot { const total = snapshot.plan.meals.reduce((acc, meal) => { acc.totalCalories += meal.calories; acc.totalProteinGrams += meal.proteinGrams; acc.totalCarbsGrams += meal.carbsGrams; acc.totalFatGrams += meal.fatGrams; acc.totalCostVnd += meal.costVnd; return acc; }, { totalCalories: 0, totalProteinGrams: 0, totalCarbsGrams: 0, totalFatGrams: 0, totalCostVnd: 0 }); const plan = { ...snapshot.plan, ...total, withinBudget: total.totalCostVnd <= snapshot.budgetVnd, withinMacroTargets: total.totalCalories >= snapshot.targetMacros.calories * 0.9 && total.totalCalories <= snapshot.targetMacros.calories * 1.1 && total.totalProteinGrams >= snapshot.targetMacros.proteinGrams * 0.9 && total.totalProteinGrams <= snapshot.targetMacros.proteinGrams * 1.1 && total.totalCarbsGrams >= snapshot.targetMacros.carbsGrams * 0.9 && total.totalCarbsGrams <= snapshot.targetMacros.carbsGrams * 1.1 && total.totalFatGrams >= snapshot.targetMacros.fatGrams * 0.9 && total.totalFatGrams <= snapshot.targetMacros.fatGrams * 1.1 }; return { ...snapshot, plan }; }
  function updateEditableSnapshot(updater: (snapshot: MealPlanSnapshot) => MealPlanSnapshot) { setEditableSnapshot((current) => { if (!current) return current; const next = updater(cloneSnapshot(current)); return recalcSnapshot(next); }); }
  function handleCustomizePlan() { if (!result) return; const snapshot: MealPlanSnapshot = { budgetVnd: Number(budgetVnd), targetMacros, plan: result }; setEditableSnapshot(recalcSnapshot(snapshot)); setPlanId(null); setPlanVersions([]); setHistoryError(null); setIsEditing(true); }
  function handleCreateCustomPlan() { const emptySnapshot: MealPlanSnapshot = { budgetVnd: Number(budgetVnd), targetMacros, plan: { meals: [], totalCalories: 0, totalProteinGrams: 0, totalCarbsGrams: 0, totalFatGrams: 0, totalCostVnd: 0, withinBudget: true, withinMacroTargets: false } }; setEditableSnapshot(emptySnapshot); setPlanName("My meal plan"); setPlanId(null); setPlanVersions([]); setHistoryError(null); setIsEditing(true); }
  function handleAddMeal() { updateEditableSnapshot((snapshot) => { const nextIndex = snapshot.plan.meals.length + 1; snapshot.plan.meals.push({ name: `Meal ${nextIndex}`, entries: [], calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, costVnd: 0 }); return snapshot; }); }
  function handleRemoveMeal(index: number) { updateEditableSnapshot((snapshot) => { snapshot.plan.meals.splice(index, 1); return snapshot; }); }
  function handleUpdateMealName(index: number, name: string) { updateEditableSnapshot((snapshot) => { const meal = snapshot.plan.meals[index]; if (meal) meal.name = name; return snapshot; }); }
  function handleAddEntry(mealIndex: number) { updateEditableSnapshot((snapshot) => { const meal = snapshot.plan.meals[mealIndex]; if (!meal) return snapshot; meal.entries.push({ foodId: `custom-${meal.entries.length + 1}`, foodName: "New item", grams: 100, calories: 0, costVnd: 0 }); recalcMeal(meal); return snapshot; }); }
  function handleRemoveEntry(mealIndex: number, entryIndex: number) { updateEditableSnapshot((snapshot) => { const meal = snapshot.plan.meals[mealIndex]; if (!meal) return snapshot; meal.entries.splice(entryIndex, 1); recalcMeal(meal); return snapshot; }); }
  function handleUpdateEntry(mealIndex: number, entryIndex: number, updates: { foodName?: string; grams?: number; calories?: number; costVnd?: number }) { updateEditableSnapshot((snapshot) => { const meal = snapshot.plan.meals[mealIndex]; if (!meal) return snapshot; const entry = meal.entries[entryIndex]; if (!entry) return snapshot; const nextGrams = updates.grams ?? entry.grams; const currentCaloriesPerGram = entry.grams > 0 ? entry.calories / entry.grams : 0; const currentCostPerGram = entry.grams > 0 ? entry.costVnd / entry.grams : 0; entry.foodName = updates.foodName ?? entry.foodName; entry.grams = nextGrams; entry.calories = updates.calories ?? Math.round(nextGrams * currentCaloriesPerGram); entry.costVnd = updates.costVnd ?? Math.round(nextGrams * currentCostPerGram); recalcMeal(meal); return snapshot; }); }

  async function handleSavePlan() {
    if (!editableSnapshot) return;
    if (!signedIn) { const message = "Sign in to save meal plans."; setError(message); pushNotice({ title: "Sign in required", message, tone: "warning" }); setBanner({ title: "Sign in required", message, tone: "warning" }); return; }
    if (!planName.trim()) { const message = "Plan name is required."; setError(message); pushNotice({ title: "Invalid meal plan", message, tone: "error" }); setBanner({ title: "Invalid meal plan", message, tone: "error" }); return; }
    setSavingPlan(true); setError(null);
    try {
      const payload = await authedJsonFetch<{ planId: string; version: MealPlanVersion }>("/api/meal-plans", { method: "POST", body: JSON.stringify({ planId, name: planName.trim(), budgetVnd: editableSnapshot.budgetVnd, targetMacros: editableSnapshot.targetMacros, plan: editableSnapshot.plan, source: isEditing ? "custom" : "generated" }) });
      setPlanId(payload.planId); setPlanVersions((current) => [payload.version, ...current]); pushNotice({ title: "Meal plan saved", message: "Your meal plan version was stored.", tone: "success" }); setBanner({ title: "Meal plan saved", message: "Your meal plan version was stored.", tone: "success" });
    } catch (saveError) { const message = saveError instanceof Error ? saveError.message : "Unable to save meal plan."; setError(message); pushNotice({ title: "Meal save error", message, tone: "error" }); setBanner({ title: "Meal save error", message, tone: "error" }); }
    finally { setSavingPlan(false); }
  }

  async function handleLoadHistory() {
    if (!planId) return;
    setHistoryLoading(true); setHistoryError(null);
    try { const payload = await authedJsonFetch<{ versions: MealPlanVersion[] }>(`/api/meal-plans?planId=${planId}`); setPlanVersions(payload.versions); pushNotice({ title: "Meal history loaded", message: "Historical versions were refreshed.", tone: "success" }); }
    catch (loadError) { const message = loadError instanceof Error ? loadError.message : "Unable to load meal history."; setHistoryError(message); pushNotice({ title: "Meal history error", message, tone: "error" }); setBanner({ title: "Meal history error", message, tone: "error" }); }
    finally { setHistoryLoading(false); }
  }

  const workoutPlannerHref = useMemo(() => { const params = new URLSearchParams({ daysPerWeek: "4", equipment: "dumbbells" }); const goalParam = searchParams.get("goal"); if (goalParam) params.set("goal", goalParam); return `/workout?${params.toString()}`; }, [searchParams]);
  const planSource = editableSnapshot ?? (result ? { plan: result } : null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    try { const payload = await fetchJson<MealResponse>("/api/meal", { method: "POST", body: JSON.stringify({ budgetVnd: Number(budgetVnd), ...targetMacros, foods: vietnameseFoods }) }); setResult(payload); pushNotice({ title: "Meal plan generated", message: "Your budget-friendly plan is ready.", tone: "success" }); setBanner({ title: "Meal plan generated", message: "Your budget-friendly plan is ready.", tone: "success" }); }
    catch (submitError) { const message = submitError instanceof Error ? submitError.message : "Unable to generate meal plan."; setError(message); pushNotice({ title: "Meal generation error", message, tone: "error" }); setBanner({ title: "Meal generation error", message, tone: "error" }); setResult(null); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Meal</p>
          <h1 className="mt-2 text-3xl font-semibold">Tạo và lưu kế hoạch bữa ăn</h1>
          <p className="mt-2 text-sm text-muted-foreground">Nhập mục tiêu macro, tạo kế hoạch budget-friendly, rồi chỉnh sửa và lưu phiên bản.</p>
        </section>

        <section className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
          <div className="mb-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Chú thích</p>
            <p className="mt-1">Nhập ngân sách và macro mục tiêu để hệ thống tạo meal plan phù hợp, sau đó bạn có thể chỉnh sửa và lưu phiên bản.</p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-2 text-sm font-medium">
              <span>Ngân sách (VND)</span>
              <input className={inputClass} value={budgetVnd} onChange={(e) => setBudgetVnd(e.target.value)} placeholder="90000" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Calories</span>
              <input className={inputClass} value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2550" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Protein (g)</span>
              <input className={inputClass} value={proteinGrams} onChange={(e) => setProteinGrams(e.target.value)} placeholder="118" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Carbs (g)</span>
              <input className={inputClass} value={carbsGrams} onChange={(e) => setCarbsGrams(e.target.value)} placeholder="360" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Fat (g)</span>
              <input className={inputClass} value={fatGrams} onChange={(e) => setFatGrams(e.target.value)} placeholder="71" />
            </label>
            <button className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white md:col-span-2 lg:col-span-5">{loading ? "Đang tạo..." : "Tạo meal plan"}</button>
          </form>
        </section>

        {(result || editableSnapshot) && (
          <section className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-primary">Kết quả</p>
                <h2 className="mt-2 text-2xl font-semibold">Meal plan của bạn</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{editableSnapshot ? "Đã có phiên bản chỉnh sửa" : "Kết quả generate mới"}</span>
                <button type="button" onClick={handleLoadHistory} disabled={!planId || historyLoading} className="rounded-full border border-border px-4 py-2 font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60">
                  {historyLoading ? "Đang tải history..." : "Tải history"}
                </button>
              </div>
            </div>

            {(historyError || planVersions.length > 0) && (
              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Meal history / version</h3>
                    <p className="text-sm text-muted-foreground">Các phiên bản đã lưu gần nhất.</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{planVersions.length} version(s)</span>
                </div>
                {historyError ? (
                  <p className="mt-3 text-sm text-destructive">{historyError}</p>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {planVersions.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => {
                          setEditableSnapshot(version.snapshot);
                          setPlanId(version.planId);
                          setPlanName(`Meal plan ${new Date(version.createdAt).toLocaleDateString()}`);
                          setIsEditing(false);
                        }}
                        className="rounded-2xl border border-border bg-surface/70 p-4 text-left transition hover:border-primary hover:bg-background"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Version {new Date(version.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{version.source ?? "generated"}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">#{version.planId.slice(0, 8)}</span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{version.snapshot.plan.meals.length} meals • {version.snapshot.plan.totalCostVnd.toLocaleString()}đ</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(editableSnapshot?.plan.meals ?? result?.meals ?? []).map((meal, index) => (
                <article key={`${meal.name}-${index}`} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">{meal.entries.length} món</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{meal.costVnd.toLocaleString()}đ</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div>Calories: {Math.round(meal.calories)}</div>
                    <div>Protein: {Math.round(meal.proteinGrams)}g</div>
                    <div>Carbs: {Math.round(meal.carbsGrams)}g</div>
                    <div>Fat: {Math.round(meal.fatGrams)}g</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold">Chi tiết entry</p>
                    {meal.entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Không có entry nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {meal.entries.map((entry, entryIndex) => (
                          <div key={`${entry.foodId}-${entryIndex}`} className="rounded-xl border border-border bg-surface/70 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{entry.foodName}</span>
                              <span className="text-xs text-muted-foreground">{entry.grams}g</span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-1 text-muted-foreground">
                              <span>Calories: {Math.round(entry.calories)}</span>
                              <span>Cost: {entry.costVnd.toLocaleString()}đ</span>
                              <span className="col-span-2">Food ID: {entry.foodId}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
