import { getMuscleGroup, muscleGroupLabels } from "@/lib/workout/muscle-groups";

describe("getMuscleGroup", () => {
  it("identifies chest exercises", () => {
    expect(getMuscleGroup("bench press")).toBe("chest");
    expect(getMuscleGroup("push-up")).toBe("chest");
    expect(getMuscleGroup("dumbbell fly")).toBe("chest");
    expect(getMuscleGroup("dips")).toBe("chest");
  });

  it("identifies back exercises", () => {
    expect(getMuscleGroup("deadlift")).toBe("back");
    expect(getMuscleGroup("barbell row")).toBe("back");
    expect(getMuscleGroup("pull-up")).toBe("back");
    expect(getMuscleGroup("lat pulldown")).toBe("back");
  });

  it("identifies legs exercises", () => {
    expect(getMuscleGroup("squat")).toBe("legs");
    expect(getMuscleGroup("lunge")).toBe("legs");
    expect(getMuscleGroup("leg press")).toBe("legs");
    expect(getMuscleGroup("calf raise")).toBe("legs");
    expect(getMuscleGroup("hip thrust")).toBe("legs");
  });

  it("identifies shoulders exercises", () => {
    expect(getMuscleGroup("shoulder press")).toBe("shoulders");
    expect(getMuscleGroup("lateral raise")).toBe("shoulders");
    expect(getMuscleGroup("face pull")).toBe("shoulders");
  });

  it("identifies arms exercises", () => {
    expect(getMuscleGroup("bicep curl")).toBe("arms");
    expect(getMuscleGroup("triceps extension")).toBe("arms");
    expect(getMuscleGroup("skull crusher")).toBe("arms");
    expect(getMuscleGroup("hammer curl")).toBe("arms");
  });

  it("identifies core exercises", () => {
    expect(getMuscleGroup("plank")).toBe("core");
    expect(getMuscleGroup("crunch")).toBe("core");
    expect(getMuscleGroup("dead bug")).toBe("core");
    expect(getMuscleGroup("burpee")).toBe("core");
  });

  it("defaults to 'arms' for unrecognized exercises", () => {
    expect(getMuscleGroup("unknown exercise")).toBe("arms");
  });

  it("is case-insensitive", () => {
    expect(getMuscleGroup("BENCH PRESS")).toBe("chest");
    expect(getMuscleGroup("Squat")).toBe("legs");
  });
});

describe("muscleGroupLabels", () => {
  it("has all six muscle groups", () => {
    const groups = Object.keys(muscleGroupLabels);
    expect(groups).toContain("chest");
    expect(groups).toContain("back");
    expect(groups).toContain("legs");
    expect(groups).toContain("shoulders");
    expect(groups).toContain("arms");
    expect(groups).toContain("core");
  });

  it("has Vietnamese and English labels for each group", () => {
    for (const [, labels] of Object.entries(muscleGroupLabels)) {
      expect(labels.vi).toBeTruthy();
      expect(labels.en).toBeTruthy();
      expect(typeof labels.vi).toBe("string");
      expect(typeof labels.en).toBe("string");
    }
  });
});
