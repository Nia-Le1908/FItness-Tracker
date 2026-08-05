export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core";

const keywordMap: Record<string, MuscleGroup> = {
  squat: "legs",
  deadlift: "back",
  rdl: "legs",
  romanian: "legs",
  lunge: "legs",
  "leg press": "legs",
  "leg extension": "legs",
  "leg curl": "legs",
  "calf raise": "legs",
  "hip thrust": "legs",
  "glute bridge": "legs",
  step: "legs",
  bench: "chest",
  "push-up": "chest",
  pushup: "chest",
  fly: "chest",
  dips: "chest",
  pec: "chest",
  row: "back",
  "pull-up": "back",
  pullup: "back",
  chin: "back",
  pulldown: "back",
  shrug: "back",
  face: "shoulders",
  press: "shoulders",
  lateral: "shoulders",
  raise: "shoulders",
  curl: "arms",
  extension: "arms",
  triceps: "arms",
  skull: "arms",
  hammer: "arms",
  plank: "core",
  "dead bug": "core",
  crunch: "core",
  ab: "core",
  burpee: "core"
};

export function getMuscleGroup(exerciseName: string): MuscleGroup {
  const lower = exerciseName.toLowerCase().trim();

  for (const keyword of Object.keys(keywordMap)) {
    if (lower.includes(keyword)) {
      return keywordMap[keyword];
    }
  }

  if (lower.includes("push-up") || lower.includes("bench") || lower.includes("fly")) return "chest";
  if (lower.includes("pull") || lower.includes("row") || lower.includes("shrug")) return "back";
  if (lower.includes("squat") || lower.includes("deadlift") || lower.includes("lunge") || lower.includes("leg") || lower.includes("calf") || lower.includes("hip") || lower.includes("glute")) return "legs";
  if (lower.includes("press") || lower.includes("raise") || lower.includes("face pull")) return "shoulders";
  if (lower.includes("curl") || lower.includes("triceps") || lower.includes("skull") || lower.includes("hammer")) return "arms";
  if (lower.includes("plank") || lower.includes("crunch") || lower.includes("dead bug") || lower.includes("burpee")) return "core";

  return "arms";
}

export const muscleGroupLabels: Record<MuscleGroup, { vi: string; en: string }> = {
  chest: { vi: "Ngực", en: "Chest" },
  back: { vi: "Lưng", en: "Back" },
  legs: { vi: "Chân", en: "Legs" },
  shoulders: { vi: "Vai", en: "Shoulders" },
  arms: { vi: "Tay", en: "Arms" },
  core: { vi: "Core", en: "Core" }
};
