import { buildWorkoutPlan } from "@/services/workout.service";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { assertRequestBody, isAllowedValue, toOptionalPositiveInteger, toTrimmedString } from "@/lib/api/validation";
import { apiDefaults } from "@/lib/constants";
import type { WorkoutEquipment, WorkoutExperience, WorkoutGoal, WorkoutInput, WorkoutPeriodization } from "@/types";

const workoutGoals = ["cut", "maintain", "bulk"] as const;
const workoutExperienceLevels = ["beginner", "intermediate", "advanced"] as const;
const workoutEquipment = ["bodyweight", "dumbbells", "full_gym"] as const;
const workoutPeriodizations = ["linear", "daily_undulating", "block"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    assertRequestBody(body);

    const goal = isAllowedValue(body.goal, workoutGoals) ? body.goal : null;
    const experienceLevel = isAllowedValue(body.experienceLevel, workoutExperienceLevels) ? body.experienceLevel : null;
    const equipment = isAllowedValue(body.equipment, workoutEquipment) ? body.equipment : null;
    const daysPerWeek = toOptionalPositiveInteger(body.daysPerWeek);
    const sessionMinutes = toOptionalPositiveInteger(body.sessionMinutes);

    if (!goal || !experienceLevel || !equipment || !daysPerWeek || !sessionMinutes) {
      throw new Error("Invalid workout request.");
    }

    const workoutInput: WorkoutInput = {
      goal: goal as WorkoutGoal,
      daysPerWeek,
      experienceLevel: experienceLevel as WorkoutExperience,
      equipment: equipment as WorkoutEquipment,
      sessionMinutes,
      seed: typeof body.seed === "string" && body.seed.trim().length > 0 ? toTrimmedString(body.seed) : undefined,
      periodization: isAllowedValue(body.periodization, workoutPeriodizations) ? (body.periodization as WorkoutPeriodization) : undefined
    };

    const result = buildWorkoutPlan(workoutInput);

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error, "Unable to build workout plan.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
