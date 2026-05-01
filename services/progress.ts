import type { SupabaseClient } from "@supabase/supabase-js";

import type { WeightEntry } from "@/types";

export interface ProgressRecord {
  id: string;
  recorded_at: string;
  weight_kg: number;
}

export interface CreateProgressInput {
  recordedAt: string;
  weightKg: number;
}

export async function fetchProgressEntries(
  supabase: SupabaseClient,
  userId: string
): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from("progress")
    .select("recorded_at, weight_kg")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((entry) => ({
    date: entry.recorded_at,
    weightKg: Number(entry.weight_kg)
  }));
}

export async function createProgressEntry(
  supabase: SupabaseClient,
  userId: string,
  input: CreateProgressInput
): Promise<void> {
  const { error } = await supabase.from("progress").insert(
    {
      user_id: userId,
      recorded_at: input.recordedAt,
      weight_kg: input.weightKg
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}
