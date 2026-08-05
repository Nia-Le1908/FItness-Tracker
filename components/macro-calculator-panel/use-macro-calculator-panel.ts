"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { authedJsonFetch, fetchJson } from "@/lib/api/client";
import { macroPlannerDefaults } from "@/lib/constants";
import type { ActivityLevel, Goal, MacroPlanVersion, MacroRecommendation, MacroTargets } from "@/types";
import type { UserProfile } from "@/hooks/use-user-profile";

export type MacroCalculatorFormState = {
  weightKg: string;
  bodyFatPercent: string;
  goal: Goal;
  activityLevel: ActivityLevel;
};

type MacroResponse = MacroRecommendation;

export interface MacroCalculatorPanelController {
  form: MacroCalculatorFormState;
  result: MacroTargets | null;
  editableMacro: MacroTargets | null;
  planName: string;
  planId: string | null;
  planVersions: MacroPlanVersion[];
  isEditing: boolean;
  savingPlan: boolean;
  historyLoading: boolean;
  historyError: string | null;
  planLoading: boolean;
  error: string | null;
  loading: boolean;
  setField: <K extends keyof MacroCalculatorFormState>(field: K, value: MacroCalculatorFormState[K]) => void;
  setPlanName: (value: string) => void;
  setEditing: (value: boolean) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleCustomizeTarget: () => void;
  handleCreateCustomTarget: () => void;
  updateEditableMacro: (updates: Partial<MacroTargets>) => void;
  handleSavePlan: () => Promise<void>;
  handleLoadHistory: () => Promise<void>;
}

const defaultForm: MacroCalculatorFormState = {
  weightKg: "72",
  bodyFatPercent: "18",
  goal: "maintain",
  activityLevel: "moderate"
};

export function useMacroCalculatorPanel({ signedIn, supabase, userProfile, profileLoading }: { signedIn: boolean; supabase: SupabaseClient | null; userProfile?: UserProfile; profileLoading?: boolean }): MacroCalculatorPanelController {
  const [form, setForm] = useState<MacroCalculatorFormState>(defaultForm);
  const [result, setResult] = useState<MacroTargets | null>(null);
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
  const [profilePrefilled, setProfilePrefilled] = useState(false);

  useEffect(() => {
    if (profilePrefilled || profileLoading || !userProfile) return;
    const defaults: Partial<MacroCalculatorFormState> = {};
    if (userProfile.weightKg !== null) defaults.weightKg = String(userProfile.weightKg);
    if (userProfile.bodyFatPercent !== null) defaults.bodyFatPercent = String(userProfile.bodyFatPercent);
    if (userProfile.goal) defaults.goal = userProfile.goal;
    if (userProfile.activityLevel) defaults.activityLevel = userProfile.activityLevel;
    setForm((current) => ({ ...current, ...defaults }));
    setProfilePrefilled(true);
  }, [profilePrefilled, profileLoading, userProfile]);

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
      if (!signedIn || planLoading || editableMacro || result || !supabase) {
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
  }, [editableMacro, planLoading, result, signedIn, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchJson<MacroResponse>("/api/macro", {
        method: "POST",
        body: JSON.stringify({
          weightKg: Number(form.weightKg),
          bodyFatPercent: Number(form.bodyFatPercent),
          goal: form.goal,
          activityLevel: form.activityLevel
        })
      });

      setResult(payload.targets);
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
    const calories = macroPlannerDefaults.customCalories;
    setEditableMacro({
      leanBodyMassKg: 0,
      bmrCalories: calories,
      targetCalories: calories,
      calories,
      proteinGrams: macroPlannerDefaults.customProteinGrams,
      carbsGrams: macroPlannerDefaults.customCarbsGrams,
      fatGrams: macroPlannerDefaults.customFatGrams
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

  function setField<K extends keyof MacroCalculatorFormState>(field: K, value: MacroCalculatorFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return {
    form,
    result,
    editableMacro,
    planName,
    planId,
    planVersions,
    isEditing,
    savingPlan,
    historyLoading,
    historyError,
    planLoading,
    error,
    loading,
    setField,
    setPlanName,
    setEditing: setIsEditing,
    handleSubmit,
    handleCustomizeTarget,
    handleCreateCustomTarget,
    updateEditableMacro,
    handleSavePlan,
    handleLoadHistory
  };
}
