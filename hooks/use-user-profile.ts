"use client";

import { useEffect, useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";

export interface UserProfile {
  goal: "cut" | "maintain" | "bulk";
  weightKg: number | null;
  bodyFatPercent: number | null;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | null;
  heightCm: number | null;
  sex: "male" | "female" | "other" | null;
  dailyBudgetVnd: number | null;
  fullName: string | null;
}

function defaultProfile(): UserProfile {
  return {
    goal: "maintain",
    weightKg: null,
    bodyFatPercent: null,
    activityLevel: null,
    heightCm: null,
    sex: null,
    dailyBudgetVnd: null,
    fullName: null
  };
}

export function useUserProfile() {
  const { supabase, signedIn, loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      // Wait until the auth session has resolved. Otherwise `signedIn` is
      // briefly false on first render and the prefill effects downstream would
      // lock in default values before the real profile loads.
      if (sessionLoading) {
        setLoading(true);
        return;
      }

      if (!signedIn || !supabase) {
        setProfile(defaultProfile());
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user.id;
        if (!userId) {
          setProfile(defaultProfile());
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("goal, weight_kg, body_fat_percent, activity_level, height_cm, sex, daily_budget_vnd, full_name")
          .eq("id", userId)
          .single();

        if (!active) return;

        const row = data as Record<string, unknown> | null;
        setProfile({
          goal: (row?.goal === "cut" || row?.goal === "bulk" ? row.goal : "maintain") as UserProfile["goal"],
          weightKg: typeof row?.weight_kg === "number" ? row.weight_kg : null,
          bodyFatPercent: typeof row?.body_fat_percent === "number" ? row.body_fat_percent : null,
          activityLevel: (row?.activity_level === "sedentary" || row?.activity_level === "light" || row?.activity_level === "moderate" || row?.activity_level === "active" ? row.activity_level : null) as UserProfile["activityLevel"],
          heightCm: typeof row?.height_cm === "number" ? row.height_cm : null,
          sex: (row?.sex === "male" || row?.sex === "female" || row?.sex === "other" ? row.sex : null) as UserProfile["sex"],
          dailyBudgetVnd: typeof row?.daily_budget_vnd === "number" ? row.daily_budget_vnd : null,
          fullName: typeof row?.full_name === "string" ? row.full_name : null
        });
      } catch {
        if (active) setProfile(defaultProfile());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [signedIn, supabase, sessionLoading]);

  return { profile, loading, signedIn };
}
