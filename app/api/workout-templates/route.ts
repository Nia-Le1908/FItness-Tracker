import { createSupabaseAnonClient } from "@/lib/supabase/anon-client";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { fetchWorkoutTemplates, fetchWorkoutTemplateByKey } from "@/services/workout-templates";

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAnonClient();
    const { searchParams } = new URL(request.url);
    const templateKey = searchParams.get("key");

    if (templateKey) {
      const template = await fetchWorkoutTemplateByKey(supabase, templateKey);
      if (!template) {
        return handleApiError(new Error("Template not found."), "Template not found.", 404, "NOT_FOUND");
      }
      return jsonSuccess(template);
    }

    const goal = searchParams.get("goal") ?? undefined;
    const equipment = searchParams.get("equipment") ?? undefined;
    const experienceLevel = searchParams.get("experienceLevel") ?? undefined;
    const daysPerWeekParam = searchParams.get("daysPerWeek");
    const daysPerWeek = daysPerWeekParam ? Number(daysPerWeekParam) : undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const templates = await fetchWorkoutTemplates(supabase, {
      goal,
      equipment,
      experienceLevel,
      daysPerWeek,
      limit
    });

    return jsonSuccess(templates);
  } catch (error) {
    return handleApiError(error, "Unable to load workout templates.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}
