export type WorkoutGoal = "cut" | "maintain" | "bulk";

export type WorkoutExperience = "beginner" | "intermediate" | "advanced";

export type WorkoutEquipment = "bodyweight" | "dumbbells" | "full_gym";

export type WorkoutFocus = "full_body" | "upper" | "lower" | "push" | "pull" | "legs";

export interface WorkoutInput {
  goal: WorkoutGoal;
  daysPerWeek: number;
  experienceLevel: WorkoutExperience;
  equipment: WorkoutEquipment;
  sessionMinutes: number;
  seed?: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  equipment: WorkoutEquipment | "any";
}

export interface WorkoutDay {
  name: string;
  focus: WorkoutFocus;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  goal: WorkoutGoal;
  splitName: string;
  weeklySessions: number;
  sessionMinutes: number;
  days: WorkoutDay[];
  totalExercises: number;
}

export interface WorkoutPlanVersion {
  id: string;
  planId: string;
  createdAt: string;
  source?: string | null;
  plan: WorkoutPlan;
}

export interface WorkoutSetLog {
  id: string;
  workoutDate: string;
  recordedAt: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutSetInput {
  workoutDate?: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes?: string;
}
