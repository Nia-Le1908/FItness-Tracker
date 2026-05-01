import type {
  WorkoutDay,
  WorkoutEquipment,
  WorkoutExercise,
  WorkoutExperience,
  WorkoutFocus,
  WorkoutGoal,
  WorkoutInput,
  WorkoutPlan
} from "@/types";

interface WorkoutTemplate {
  name: string;
  focus: WorkoutFocus;
  equipment: WorkoutEquipment | "any";
}

const repRanges: Record<WorkoutGoal, string> = {
  cut: "10-15",
  maintain: "8-12",
  bulk: "6-10"
};

const restSeconds: Record<WorkoutGoal, number> = {
  cut: 45,
  maintain: 60,
  bulk: 75
};

const setsByGoal: Record<WorkoutGoal, number> = {
  cut: 3,
  maintain: 3,
  bulk: 4
};

const exerciseTemplates: Record<WorkoutFocus, WorkoutTemplate[]> = {
  full_body: [
    { name: "Squat", focus: "full_body", equipment: "full_gym" },
    { name: "Dumbbell Goblet Squat", focus: "full_body", equipment: "dumbbells" },
    { name: "Push-up", focus: "full_body", equipment: "bodyweight" },
    { name: "Dumbbell Bench Press", focus: "full_body", equipment: "dumbbells" },
    { name: "Barbell Row", focus: "full_body", equipment: "full_gym" },
    { name: "Dumbbell Romanian Deadlift", focus: "full_body", equipment: "dumbbells" },
    { name: "Plank", focus: "full_body", equipment: "bodyweight" }
  ],
  upper: [
    { name: "Bench Press", focus: "upper", equipment: "full_gym" },
    { name: "Dumbbell Bench Press", focus: "upper", equipment: "dumbbells" },
    { name: "Seated Row", focus: "upper", equipment: "full_gym" },
    { name: "One-Arm Dumbbell Row", focus: "upper", equipment: "dumbbells" },
    { name: "Overhead Press", focus: "upper", equipment: "full_gym" },
    { name: "Push-up", focus: "upper", equipment: "bodyweight" },
    { name: "Face Pull", focus: "upper", equipment: "full_gym" }
  ],
  lower: [
    { name: "Back Squat", focus: "lower", equipment: "full_gym" },
    { name: "Goblet Squat", focus: "lower", equipment: "dumbbells" },
    { name: "Romanian Deadlift", focus: "lower", equipment: "full_gym" },
    { name: "Dumbbell Romanian Deadlift", focus: "lower", equipment: "dumbbells" },
    { name: "Walking Lunge", focus: "lower", equipment: "dumbbells" },
    { name: "Bodyweight Split Squat", focus: "lower", equipment: "bodyweight" },
    { name: "Standing Calf Raise", focus: "lower", equipment: "any" }
  ],
  push: [
    { name: "Bench Press", focus: "push", equipment: "full_gym" },
    { name: "Incline Dumbbell Press", focus: "push", equipment: "dumbbells" },
    { name: "Overhead Press", focus: "push", equipment: "full_gym" },
    { name: "Push-up", focus: "push", equipment: "bodyweight" },
    { name: "Lateral Raise", focus: "push", equipment: "dumbbells" },
    { name: "Cable Triceps Pressdown", focus: "push", equipment: "full_gym" },
    { name: "Dumbbell Triceps Extension", focus: "push", equipment: "dumbbells" }
  ],
  pull: [
    { name: "Pull-up", focus: "pull", equipment: "bodyweight" },
    { name: "Lat Pulldown", focus: "pull", equipment: "full_gym" },
    { name: "Barbell Row", focus: "pull", equipment: "full_gym" },
    { name: "Dumbbell Row", focus: "pull", equipment: "dumbbells" },
    { name: "Face Pull", focus: "pull", equipment: "full_gym" },
    { name: "Rear Delt Fly", focus: "pull", equipment: "dumbbells" },
    { name: "Dumbbell Curl", focus: "pull", equipment: "dumbbells" }
  ],
  legs: [
    { name: "Back Squat", focus: "legs", equipment: "full_gym" },
    { name: "Goblet Squat", focus: "legs", equipment: "dumbbells" },
    { name: "Romanian Deadlift", focus: "legs", equipment: "full_gym" },
    { name: "Hip Thrust", focus: "legs", equipment: "full_gym" },
    { name: "Walking Lunge", focus: "legs", equipment: "dumbbells" },
    { name: "Leg Press", focus: "legs", equipment: "full_gym" },
    { name: "Calf Raise", focus: "legs", equipment: "any" }
  ]
} as const;

const splitTemplates: Record<number, { name: string; focus: WorkoutFocus[] }> = {
  2: { name: "Full body", focus: ["full_body", "full_body"] },
  3: { name: "Push / Pull / Legs", focus: ["push", "pull", "legs"] },
  4: { name: "Upper / Lower", focus: ["upper", "lower", "upper", "lower"] },
  5: { name: "Upper / Lower + specialization", focus: ["push", "pull", "legs", "upper", "lower"] },
  6: { name: "Push / Pull / Legs x2", focus: ["push", "pull", "legs", "push", "pull", "legs"] }
};

type RNG = () => number;

function createSeededRNG(seed: string = Date.now().toString()): RNG {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13; h ^= h >>> 7;
    h += h << 3; h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isCompound(name: string): boolean {
  const compoundKeywords = [
    "squat",
    "deadlift",
    "bench",
    "press",
    "row",
    "pull-up",
    "pulldown"
  ];
  return compoundKeywords.some(k => name.toLowerCase().includes(k));
}

function estimateExerciseTime(
  sets: number,
  restSeconds: number,
  avgSetSeconds = 40
): number {
  return sets * avgSetSeconds + (sets - 1) * restSeconds;
}

function buildDayExercises(
  focus: WorkoutFocus,
  equipment: WorkoutEquipment,
  goal: WorkoutGoal,
  exerciseCount: number,
  options?: {
    previousExercises?: string[];
    seed?: string;
    sessionMinutes?: number;
  }
): WorkoutExercise[] {

  const rng = createSeededRNG(options?.seed);

  // 1. filter equipment
  const templates = exerciseTemplates[focus].filter(
    t => t.equipment === "any" || t.equipment === equipment
  );

  const fallback = exerciseTemplates[focus].filter(t => t.equipment === "any");
  const pool = templates.length ? templates : fallback;

  // 2. avoid repetition
  const filtered = options?.previousExercises
    ? pool.filter(t => !options.previousExercises!.includes(t.name))
    : pool;

  const usable = filtered.length >= exerciseCount ? filtered : pool;

  // 3. split compound vs accessory
  const compounds = usable.filter(t => isCompound(t.name));
  const accessories = usable.filter(t => !isCompound(t.name));

  const shuffledCompounds = shuffle(compounds, rng);
  const shuffledAccessories = shuffle(accessories, rng);

  // 4. build list (compound first)
  let selected: typeof usable = [];

  selected.push(...shuffledCompounds.slice(0, 2));
  selected.push(
    ...shuffle(
      [...shuffledCompounds.slice(2), ...shuffledAccessories],
      rng
    ).slice(0, exerciseCount - selected.length)
  );

  selected = selected.slice(0, exerciseCount);

  // 5. build exercises with sets logic
  const exercises: WorkoutExercise[] = selected.map((template, index) => {
    const baseSets = setsByGoal[goal];
    const sets = index < 2
      ? baseSets + (goal === "bulk" ? 1 : 0)
      : baseSets;

    return {
      name: template.name,
      sets,
      reps: repRanges[goal],
      restSeconds: restSeconds[goal],
      equipment: template.equipment
    };
  });

  // 6. enforce session time constraint (optional)
  if (options?.sessionMinutes) {
    let totalTime = 0;
    const limited: WorkoutExercise[] = [];

    for (const ex of exercises) {
      const time = estimateExerciseTime(ex.sets, ex.restSeconds);
      if (totalTime + time > options.sessionMinutes * 60) break;

      limited.push(ex);
      totalTime += time;
    }

    return limited.length ? limited : exercises.slice(0, 3);
  }

  return exercises;
}

export function buildWorkoutPlan(input: WorkoutInput): WorkoutPlan {
  if (input.daysPerWeek < 2 || input.daysPerWeek > 6) {
    throw new Error("daysPerWeek must be between 2 and 6.");
  }

  if (input.sessionMinutes < 30) {
    throw new Error("sessionMinutes must be at least 30.");
  }

  const split = splitTemplates[input.daysPerWeek] ?? splitTemplates[4];
  const exerciseCount = chooseExerciseCount(input.sessionMinutes, input.experienceLevel);
  const days: WorkoutDay[] = [];
  let previousExercises: string[] = [];

  for (let index = 0; index < split.focus.length; index += 1) {
    const focus = split.focus[index];
    const exercises = buildDayExercises(focus, input.equipment, input.goal, exerciseCount, {
      previousExercises,
      seed: input.seed ? `${input.seed}-${index + 1}` : undefined,
      sessionMinutes: input.sessionMinutes
    });

    days.push({
      name: `Day ${index + 1}`,
      focus,
      exercises
    });

    previousExercises = exercises.map((exercise) => exercise.name);
  }

  return {
    goal: input.goal,
    splitName: split.name,
    weeklySessions: days.length,
    sessionMinutes: input.sessionMinutes,
    days,
    totalExercises: days.reduce((total, day) => total + day.exercises.length, 0)
  };
}

function chooseExerciseCount(sessionMinutes: number, experienceLevel: WorkoutExperience): number {
  const baseCount = sessionMinutes >= 75 ? 6 : sessionMinutes >= 60 ? 5 : 4;
  const experienceOffset = experienceLevel === "beginner" ? -1 : experienceLevel === "advanced" ? 1 : 0;
  return clamp(baseCount + experienceOffset, 3, 6);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}