import { buildWorkoutPlan } from "@/services/workout.service";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber, requireOneOf, requireString } from "@/lib/api/validation";
import type { WorkoutEquipment, WorkoutExperience, WorkoutGoal, WorkoutInput } from "@/types";

const workoutGoals = ["cut", "maintain", "bulk"] as const;
const workoutExperienceLevels = ["beginner", "intermediate", "advanced"] as const;
const workoutEquipment = ["bodyweight", "dumbbells", "full_gym"] as const;

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(await request.json());
    const workoutInput: WorkoutInput = {
      goal: requireOneOf(body.goal, "goal", workoutGoals) as WorkoutGoal,
      daysPerWeek: requireNumber(body.daysPerWeek, "daysPerWeek"),
      experienceLevel: requireOneOf(body.experienceLevel, "experienceLevel", workoutExperienceLevels) as WorkoutExperience,
      equipment: requireOneOf(body.equipment, "equipment", workoutEquipment) as WorkoutEquipment,
      sessionMinutes: requireNumber(body.sessionMinutes, "sessionMinutes"),
      seed: typeof body.seed === "string" && body.seed.trim().length > 0 ? requireString(body.seed, "seed") : undefined
    };

    const result = buildWorkoutPlan(workoutInput);

    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build workout plan.";
    return jsonError(message, 400, "BAD_REQUEST");
  }
}
