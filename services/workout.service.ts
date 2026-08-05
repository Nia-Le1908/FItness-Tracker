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
import { parseRepRange } from "@/types";

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

const exerciseEquivalents: Record<string, string[]> = {
  "Barbell Back Squat": ["Goblet Squat", "Bodyweight Squat"],
  "Barbell Bench Press": ["Dumbbell Bench Press", "Push-up"],
  "Barbell Row": ["Dumbbell Row", "Inverted Row"],
  "Conventional Deadlift": ["Romanian Deadlift", "Dumbbell RDL"],
  "Overhead Press": ["Seated Dumbbell Press", "Arnold Press"],
  "Pull-up": ["Lat Pulldown", "Inverted Row"],
  "Lat Pulldown": ["Pull-up", "Inverted Row"],
  "Leg Press": ["Goblet Squat", "Bodyweight Squat"],
  "Barbell Curl": ["Dumbbell Curl", "Hammer Curl"],
  "Cable Triceps Pushdown": ["Overhead Triceps Extension", "Dips"],
  "Leg Curl": ["Nordic Hamstring Curl", "Dumbbell RDL"],
  "Leg Extension": ["Walking Lunge", "Sissy Squat"],
  "Hip Thrust": ["Glute Bridge", "Bulgarian Split Squat"],
  "Cable Fly": ["Dumbbell Fly", "Push-up"],
  "Seated Cable Row": ["Dumbbell Row", "Inverted Row"],
  "Seated Calf Raise": ["Standing Calf Raise", "Single-Leg Calf Raise"]
};

function substituteExercise(name: string, equipment: WorkoutEquipment): string | null {
  const equivalents = exerciseEquivalents[name];
  if (!equivalents) return null;

  for (const eq of equivalents) {
    const found = findTemplateByName(eq);
    if (found && (found.equipment === equipment || found.equipment === "any")) {
      return eq;
    }
  }
  return null;
}

function findTemplateByName(name: string): WorkoutTemplate | undefined {
  for (const [_key, templates] of Object.entries(exerciseTemplates)) {
    const found = templates.find((t) => t.name === name);
    if (found) return found;
  }
  return undefined;
}

const exerciseTemplates: Record<WorkoutFocus, WorkoutTemplate[]> = {
  full_body: [
    { name: "Barbell Back Squat", focus: "full_body", equipment: "full_gym" },
    { name: "Goblet Squat", focus: "full_body", equipment: "dumbbells" },
    { name: "Bodyweight Squat", focus: "full_body", equipment: "bodyweight" },
    { name: "Bulgarian Split Squat", focus: "full_body", equipment: "dumbbells" },
    { name: "Push-up", focus: "full_body", equipment: "bodyweight" },
    { name: "Dumbbell Bench Press", focus: "full_body", equipment: "dumbbells" },
    { name: "Barbell Bench Press", focus: "full_body", equipment: "full_gym" },
    { name: "Barbell Row", focus: "full_body", equipment: "full_gym" },
    { name: "Dumbbell Row", focus: "full_body", equipment: "dumbbells" },
    { name: "Romanian Deadlift", focus: "full_body", equipment: "full_gym" },
    { name: "Dumbbell RDL", focus: "full_body", equipment: "dumbbells" },
    { name: "Overhead Press", focus: "full_body", equipment: "full_gym" },
    { name: "Seated Dumbbell Press", focus: "full_body", equipment: "dumbbells" },
    { name: "Lat Pulldown", focus: "full_body", equipment: "full_gym" },
    { name: "Inverted Row", focus: "full_body", equipment: "bodyweight" },
    { name: "Plank", focus: "full_body", equipment: "bodyweight" },
    { name: "Dead Bug", focus: "full_body", equipment: "bodyweight" },
    { name: "Kettlebell Swing", focus: "full_body", equipment: "dumbbells" },
    { name: "Thruster", focus: "full_body", equipment: "dumbbells" },
    { name: "Burpee", focus: "full_body", equipment: "bodyweight" }
  ],
  upper: [
    { name: "Barbell Bench Press", focus: "upper", equipment: "full_gym" },
    { name: "Dumbbell Bench Press", focus: "upper", equipment: "dumbbells" },
    { name: "Incline Dumbbell Press", focus: "upper", equipment: "dumbbells" },
    { name: "Incline Barbell Press", focus: "upper", equipment: "full_gym" },
    { name: "Decline Push-up", focus: "upper", equipment: "bodyweight" },
    { name: "Cable Fly", focus: "upper", equipment: "full_gym" },
    { name: "Seated Cable Row", focus: "upper", equipment: "full_gym" },
    { name: "One-Arm Dumbbell Row", focus: "upper", equipment: "dumbbells" },
    { name: "Barbell Row", focus: "upper", equipment: "full_gym" },
    { name: "Pull-up", focus: "upper", equipment: "bodyweight" },
    { name: "Lat Pulldown", focus: "upper", equipment: "full_gym" },
    { name: "Overhead Press", focus: "upper", equipment: "full_gym" },
    { name: "Seated Dumbbell Press", focus: "upper", equipment: "dumbbells" },
    { name: "Lateral Raise", focus: "upper", equipment: "dumbbells" },
    { name: "Front Raise", focus: "upper", equipment: "dumbbells" },
    { name: "Face Pull", focus: "upper", equipment: "full_gym" },
    { name: "Rear Delt Fly", focus: "upper", equipment: "dumbbells" },
    { name: "Barbell Curl", focus: "upper", equipment: "full_gym" },
    { name: "Dumbbell Curl", focus: "upper", equipment: "dumbbells" },
    { name: "Hammer Curl", focus: "upper", equipment: "dumbbells" },
    { name: "Cable Triceps Pushdown", focus: "upper", equipment: "full_gym" },
    { name: "Overhead Triceps Extension", focus: "upper", equipment: "dumbbells" },
    { name: "Dips", focus: "upper", equipment: "bodyweight" },
    { name: "Skull Crusher", focus: "upper", equipment: "full_gym" }
  ],
  lower: [
    { name: "Barbell Back Squat", focus: "lower", equipment: "full_gym" },
    { name: "Front Squat", focus: "lower", equipment: "full_gym" },
    { name: "Goblet Squat", focus: "lower", equipment: "dumbbells" },
    { name: "Bulgarian Split Squat", focus: "lower", equipment: "dumbbells" },
    { name: "Leg Press", focus: "lower", equipment: "full_gym" },
    { name: "Hack Squat", focus: "lower", equipment: "full_gym" },
    { name: "Walking Lunge", focus: "lower", equipment: "dumbbells" },
    { name: "Reverse Lunge", focus: "lower", equipment: "bodyweight" },
    { name: "Romanian Deadlift", focus: "lower", equipment: "full_gym" },
    { name: "Dumbbell RDL", focus: "lower", equipment: "dumbbells" },
    { name: "Conventional Deadlift", focus: "lower", equipment: "full_gym" },
    { name: "Hip Thrust", focus: "lower", equipment: "full_gym" },
    { name: "Glute Bridge", focus: "lower", equipment: "bodyweight" },
    { name: "Leg Curl", focus: "lower", equipment: "full_gym" },
    { name: "Nordic Hamstring Curl", focus: "lower", equipment: "bodyweight" },
    { name: "Leg Extension", focus: "lower", equipment: "full_gym" },
    { name: "Standing Calf Raise", focus: "lower", equipment: "any" },
    { name: "Seated Calf Raise", focus: "lower", equipment: "full_gym" },
    { name: "Single-Leg Calf Raise", focus: "lower", equipment: "bodyweight" },
    { name: "Cable Pull-Through", focus: "lower", equipment: "full_gym" }
  ],
  push: [
    { name: "Barbell Bench Press", focus: "push", equipment: "full_gym" },
    { name: "Dumbbell Bench Press", focus: "push", equipment: "dumbbells" },
    { name: "Incline Barbell Press", focus: "push", equipment: "full_gym" },
    { name: "Incline Dumbbell Press", focus: "push", equipment: "dumbbells" },
    { name: "Decline Bench Press", focus: "push", equipment: "full_gym" },
    { name: "Push-up", focus: "push", equipment: "bodyweight" },
    { name: "Diamond Push-up", focus: "push", equipment: "bodyweight" },
    { name: "Cable Fly", focus: "push", equipment: "full_gym" },
    { name: "Pec Deck", focus: "push", equipment: "full_gym" },
    { name: "Overhead Press", focus: "push", equipment: "full_gym" },
    { name: "Seated Dumbbell Press", focus: "push", equipment: "dumbbells" },
    { name: "Arnold Press", focus: "push", equipment: "dumbbells" },
    { name: "Lateral Raise", focus: "push", equipment: "dumbbells" },
    { name: "Front Raise", focus: "push", equipment: "dumbbells" },
    { name: "Upright Row", focus: "push", equipment: "dumbbells" },
    { name: "Cable Triceps Pushdown", focus: "push", equipment: "full_gym" },
    { name: "Overhead Triceps Extension", focus: "push", equipment: "dumbbells" },
    { name: "Skull Crusher", focus: "push", equipment: "full_gym" },
    { name: "Dips", focus: "push", equipment: "bodyweight" },
    { name: "Close-Grip Bench Press", focus: "push", equipment: "full_gym" }
  ],
  pull: [
    { name: "Pull-up", focus: "pull", equipment: "bodyweight" },
    { name: "Chin-up", focus: "pull", equipment: "bodyweight" },
    { name: "Lat Pulldown", focus: "pull", equipment: "full_gym" },
    { name: "Barbell Row", focus: "pull", equipment: "full_gym" },
    { name: "Dumbbell Row", focus: "pull", equipment: "dumbbells" },
    { name: "T-Bar Row", focus: "pull", equipment: "full_gym" },
    { name: "Seated Cable Row", focus: "pull", equipment: "full_gym" },
    { name: "Meadows Row", focus: "pull", equipment: "dumbbells" },
    { name: "Straight-Arm Pulldown", focus: "pull", equipment: "full_gym" },
    { name: "Face Pull", focus: "pull", equipment: "full_gym" },
    { name: "Rear Delt Fly", focus: "pull", equipment: "dumbbells" },
    { name: "Barbell Shrug", focus: "pull", equipment: "full_gym" },
    { name: "Dumbbell Shrug", focus: "pull", equipment: "dumbbells" },
    { name: "Barbell Curl", focus: "pull", equipment: "full_gym" },
    { name: "Dumbbell Curl", focus: "pull", equipment: "dumbbells" },
    { name: "Hammer Curl", focus: "pull", equipment: "dumbbells" },
    { name: "Incline Dumbbell Curl", focus: "pull", equipment: "dumbbells" },
    { name: "Preacher Curl", focus: "pull", equipment: "full_gym" },
    { name: "Concentration Curl", focus: "pull", equipment: "dumbbells" },
    { name: "Cable Curl", focus: "pull", equipment: "full_gym" }
  ],
  legs: [
    { name: "Barbell Back Squat", focus: "legs", equipment: "full_gym" },
    { name: "Front Squat", focus: "legs", equipment: "full_gym" },
    { name: "Goblet Squat", focus: "legs", equipment: "dumbbells" },
    { name: "Bulgarian Split Squat", focus: "legs", equipment: "dumbbells" },
    { name: "Leg Press", focus: "legs", equipment: "full_gym" },
    { name: "Hack Squat", focus: "legs", equipment: "full_gym" },
    { name: "Walking Lunge", focus: "legs", equipment: "dumbbells" },
    { name: "Reverse Lunge", focus: "legs", equipment: "bodyweight" },
    { name: "Leg Extension", focus: "legs", equipment: "full_gym" },
    { name: "Sissy Squat", focus: "legs", equipment: "bodyweight" },
    { name: "Romanian Deadlift", focus: "legs", equipment: "full_gym" },
    { name: "Dumbbell RDL", focus: "legs", equipment: "dumbbells" },
    { name: "Conventional Deadlift", focus: "legs", equipment: "full_gym" },
    { name: "Hip Thrust", focus: "legs", equipment: "full_gym" },
    { name: "Glute Bridge", focus: "legs", equipment: "bodyweight" },
    { name: "Leg Curl", focus: "legs", equipment: "full_gym" },
    { name: "Cable Kickback", focus: "legs", equipment: "full_gym" },
    { name: "Standing Calf Raise", focus: "legs", equipment: "any" },
    { name: "Seated Calf Raise", focus: "legs", equipment: "full_gym" },
    { name: "Donkey Calf Raise", focus: "legs", equipment: "bodyweight" }
  ]
} as const;

const splitTemplates: Record<number, { name: string; focus: WorkoutFocus[] }> = {
  2: { name: "Full Body x2", focus: ["full_body", "full_body"] },
  3: { name: "Push / Pull / Legs", focus: ["push", "pull", "legs"] },
  4: { name: "Upper / Lower", focus: ["upper", "lower", "upper", "lower"] },
  5: { name: "Bro Split", focus: ["push", "pull", "legs", "upper", "lower"] },
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
    daySets?: number;
    dayReps?: string;
  }
): WorkoutExercise[] {

  const rng = createSeededRNG(options?.seed);
  const effectiveSets = options?.daySets ?? setsByGoal[goal];
  const effectiveReps = options?.dayReps ?? repRanges[goal];

  // 1. filter equipment
  const templates = exerciseTemplates[focus].filter(
    t => t.equipment === "any" || t.equipment === equipment
  );

  const fallback = exerciseTemplates[focus].filter(t => t.equipment === "any");
  let pool = templates.length ? templates : fallback;

  // 2. equipment substitution for missing exercises
  if (pool.length < exerciseCount) {
    const allFocusTemplates = exerciseTemplates[focus];
    const substitutes = allFocusTemplates
      .filter(t => t.equipment !== "any" && t.equipment !== equipment)
      .map(t => substituteExercise(t.name, equipment))
      .filter((name): name is string => name !== null)
      .map(name => findTemplateByName(name)!)
      .filter(Boolean);
    pool = [...pool, ...substitutes];
    pool = pool.filter((t, i, arr) => arr.findIndex(x => x.name === t.name) === i);
  }

  // 3. avoid repetition
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
    const baseSets = effectiveSets;
    const sets = index < 2
      ? baseSets + (goal === "bulk" ? 1 : 0)
      : baseSets;

    const parsed = parseRepRange(effectiveReps);
    return {
      name: template.name,
      sets,
      reps: effectiveReps,
      minReps: parsed.minReps,
      maxReps: parsed.maxReps,
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

function getPeriodizedGoal(baseGoal: WorkoutGoal, periodization: string, dayIndex: number, totalDays: number): WorkoutGoal {
  if (periodization === "daily_undulating" && totalDays >= 3) {
    const phase = dayIndex % 3;
    if (phase === 0) return "cut";
    if (phase === 1) return "maintain";
    return "bulk";
  }
  if (periodization === "block") {
    return baseGoal;
  }
  return baseGoal;
}

function getPeriodizedSets(baseGoal: WorkoutGoal, periodization: string, dayIndex: number): number {
  if (periodization === "daily_undulating") {
    const phase = dayIndex % 3;
    if (phase === 0) return 3;
    if (phase === 1) return 3;
    return 4;
  }
  return setsByGoal[baseGoal];
}

function getPeriodizedRepRange(baseGoal: WorkoutGoal, periodization: string, dayIndex: number): string {
  if (periodization === "daily_undulating") {
    const phase = dayIndex % 3;
    if (phase === 0) return "12-15";
    if (phase === 1) return "8-12";
    return "6-10";
  }
  return repRanges[baseGoal];
}

export function buildWorkoutPlan(input: WorkoutInput): WorkoutPlan {
  if (input.daysPerWeek < 2 || input.daysPerWeek > 6) {
    throw new Error("daysPerWeek must be between 2 and 6.");
  }

  if (input.sessionMinutes < 30) {
    throw new Error("sessionMinutes must be at least 30.");
  }

  const periodization = input.periodization ?? "linear";
  const split = splitTemplates[input.daysPerWeek] ?? splitTemplates[4];
  const exerciseCount = chooseExerciseCount(input.sessionMinutes, input.experienceLevel);
  const days: WorkoutDay[] = [];
  let previousExercises: string[] = [];

  for (let index = 0; index < split.focus.length; index += 1) {
    const focus = split.focus[index];
    const dayGoal = getPeriodizedGoal(input.goal, periodization, index, split.focus.length);
    const daySets = getPeriodizedSets(dayGoal, periodization, index);
    const dayReps = getPeriodizedRepRange(dayGoal, periodization, index);

    const exercises = buildDayExercises(focus, input.equipment, dayGoal, exerciseCount, {
      previousExercises,
      seed: input.seed ? `${input.seed}-${index + 1}` : undefined,
      sessionMinutes: input.sessionMinutes,
      daySets,
      dayReps
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