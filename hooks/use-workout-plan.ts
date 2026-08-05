"use client";

import { useCallback, useState } from "react";
import type { WorkoutEquipment, WorkoutFocus, WorkoutGoal, WorkoutPlan, WorkoutPlanVersion } from "@/types";

export function useWorkoutPlan() {
  const [goal, setGoal] = useState<WorkoutGoal>("maintain");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [experienceLevel, setExperienceLevel] = useState<string>("intermediate");
  const [equipment, setEquipment] = useState<WorkoutEquipment>("dumbbells");
  const [sessionMinutes, setSessionMinutes] = useState("60");
  const [seed, setSeed] = useState("");
  const [result, setResult] = useState<WorkoutPlan | null>(null);
  const [editablePlan, setEditablePlan] = useState<WorkoutPlan | null>(null);
  const [planName, setPlanName] = useState("My plan");
  const [planId, setPlanId] = useState<string | null>(null);
  const [planVersions, setPlanVersions] = useState<WorkoutPlanVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const clonePlan = useCallback((plan: WorkoutPlan): WorkoutPlan => ({
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({ ...exercise }))
    }))
  }), []);

  const recalcPlan = useCallback((plan: WorkoutPlan): WorkoutPlan => {
    const totalExercises = plan.days.reduce((total, day) => total + day.exercises.length, 0);
    return { ...plan, weeklySessions: plan.days.length, totalExercises };
  }, []);

  const updateEditablePlan = useCallback((updater: (plan: WorkoutPlan) => WorkoutPlan) => {
    setEditablePlan((current) => {
      if (!current) return current;
      return recalcPlan(updater(clonePlan(current)));
    });
  }, [clonePlan, recalcPlan]);

  const createBlankPlan = useCallback((): WorkoutPlan => ({
    goal,
    splitName: "Custom plan",
    weeklySessions: 0,
    sessionMinutes: Number(sessionMinutes),
    days: [],
    totalExercises: 0
  }), [goal, sessionMinutes]);

  const startCustomPlan = useCallback(() => {
    setEditablePlan(createBlankPlan());
    setPlanName("My plan");
    setPlanId(null);
    setPlanVersions([]);
    setIsEditing(true);
    setSelectedDay(null);
  }, [createBlankPlan]);

  const customizeGenerated = useCallback(() => {
    if (!result) return;
    setEditablePlan(recalcPlan(clonePlan(result)));
    setPlanName(`${result.splitName} plan`);
    setPlanId(null);
    setPlanVersions([]);
    setIsEditing(true);
  }, [result, clonePlan, recalcPlan]);

  const addDay = useCallback(() => {
    let nextName = "Day 1";
    updateEditablePlan((plan) => {
      const nextIndex = plan.days.length + 1;
      nextName = `Day ${nextIndex}`;
      plan.days.push({ name: nextName, focus: "full_body", exercises: [] });
      return plan;
    });
    setSelectedDay(nextName);
  }, [updateEditablePlan]);

  const removeDay = useCallback((dayName: string) => {
    let nextSelected: string | null = null;
    updateEditablePlan((plan) => {
      plan.days = plan.days.filter((day) => day.name !== dayName);
      nextSelected = plan.days[0]?.name ?? null;
      return plan;
    });
    setSelectedDay(nextSelected);
  }, [updateEditablePlan]);

  const updateDay = useCallback((dayName: string, updates: { name?: string; focus?: WorkoutFocus }) => {
    let nextSelected = dayName;
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      if (updates.name) { day.name = updates.name; nextSelected = updates.name; }
      if (updates.focus) { day.focus = updates.focus; }
      return plan;
    });
    setSelectedDay(nextSelected);
  }, [updateEditablePlan]);

  const addExercise = useCallback((dayName: string) => {
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      day.exercises.push({
        name: "New exercise",
        sets: 3,
        reps: "8-12",
        restSeconds: 60,
        equipment
      });
      return plan;
    });
  }, [updateEditablePlan, equipment]);

  const removeExercise = useCallback((dayName: string, exerciseIndex: number) => {
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      day.exercises = day.exercises.filter((_, index) => index !== exerciseIndex);
      return plan;
    });
  }, [updateEditablePlan]);

  const updateExercise = useCallback((
    dayName: string,
    index: number,
    updates: Partial<WorkoutPlan["days"][number]["exercises"][number]>
  ) => {
    updateEditablePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      const exercise = day.exercises[index];
      if (!exercise) return plan;
      Object.assign(exercise, updates);
      return plan;
    });
  }, [updateEditablePlan]);

  const handlePlanSaved = useCallback((updatedPlanId: string, version: WorkoutPlanVersion) => {
    setPlanId(updatedPlanId);
    setPlanVersions((current) => [version, ...current]);
  }, []);

  return {
    goal, setGoal,
    daysPerWeek, setDaysPerWeek,
    experienceLevel, setExperienceLevel,
    equipment, setEquipment,
    sessionMinutes, setSessionMinutes,
    seed, setSeed,
    result, setResult,
    editablePlan, setEditablePlan,
    planName, setPlanName,
    planId, setPlanId,
    planVersions, setPlanVersions,
    isEditing, setIsEditing,
    selectedDay, setSelectedDay,
    startCustomPlan,
    customizeGenerated,
    addDay,
    removeDay,
    updateDay,
    addExercise,
    removeExercise,
    updateExercise,
    handlePlanSaved
  };
}
