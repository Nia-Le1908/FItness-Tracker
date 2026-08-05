import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutTemplate } from "@/types";

interface TemplateRow {
  id: string;
  template_key: string;
  name: string;
  description: string;
  goal: string;
  tags: string[];
  experience_level: string;
  days_per_week: number;
  equipment: string;
  plan_json: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FetchOptions {
  goal?: string;
  equipment?: string;
  experienceLevel?: string;
  daysPerWeek?: number;
  limit?: number;
}

export async function fetchWorkoutTemplates(
  supabase: SupabaseClient,
  options: FetchOptions = {}
): Promise<WorkoutTemplate[]> {
  let query = supabase
    .from("workout_plan_templates")
    .select("*")
    .eq("is_active", true);

  if (options.goal) {
    query = query.eq("goal", options.goal);
  }

  if (options.equipment) {
    query = query.or(`equipment.eq.${options.equipment},equipment.eq.any`);
  }

  if (options.experienceLevel) {
    query = query.eq("experience_level", options.experienceLevel);
  }

  if (options.daysPerWeek) {
    query = query.eq("days_per_week", options.daysPerWeek);
  }

  query = query.order("created_at", { ascending: true }).limit(options.limit ?? 50);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data as TemplateRow[] | null ?? []).map(toWorkoutTemplate);
}

export async function fetchWorkoutTemplateByKey(
  supabase: SupabaseClient,
  templateKey: string
): Promise<WorkoutTemplate | null> {
  const { data, error } = await supabase
    .from("workout_plan_templates")
    .select("*")
    .eq("template_key", templateKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return toWorkoutTemplate(data as TemplateRow);
}

function toWorkoutTemplate(row: TemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    templateKey: row.template_key,
    name: row.name,
    description: row.description,
    goal: row.goal as WorkoutTemplate["goal"],
    tags: row.tags ?? [],
    experienceLevel: row.experience_level as WorkoutTemplate["experienceLevel"],
    daysPerWeek: row.days_per_week,
    equipment: row.equipment as WorkoutTemplate["equipment"],
    plan: row.plan_json as WorkoutTemplate["plan"],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
