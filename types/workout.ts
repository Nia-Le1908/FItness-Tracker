export type WorkoutGoal = "cut" | "maintain" | "bulk";

export type WorkoutExperience = "beginner" | "intermediate" | "advanced";

export type WorkoutEquipment = "bodyweight" | "dumbbells" | "full_gym";

export type WorkoutFocus = "full_body" | "upper" | "lower" | "push" | "pull" | "legs";

export type WorkoutPeriodization = "linear" | "daily_undulating" | "block";

export interface WorkoutInput {
  goal: WorkoutGoal;
  daysPerWeek: number;
  experienceLevel: WorkoutExperience;
  equipment: WorkoutEquipment;
  sessionMinutes: number;
  seed?: string;
  periodization?: WorkoutPeriodization;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  minReps?: number;
  maxReps?: number;
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
  rpe?: number | null;
  rir?: number | null;
}

export interface WorkoutSetInput {
  workoutDate?: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes?: string;
  sessionId?: string;
  rpe?: number;
  rir?: number;
}

export function parseRepRange(reps: string): { minReps: number; maxReps: number } {
  const parts = reps.split("-").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { minReps: parts[0], maxReps: parts[1] };
  }
  const single = Number(reps);
  if (!isNaN(single)) return { minReps: single, maxReps: single };
  return { minReps: 8, maxReps: 12 };
}

export interface WorkoutTemplate {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  goal: WorkoutGoal;
  tags: string[];
  experienceLevel: WorkoutExperience;
  daysPerWeek: number;
  equipment: WorkoutEquipment;
  plan: WorkoutPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  planId: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  createdAt: string;
}
