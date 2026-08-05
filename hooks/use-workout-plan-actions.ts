"use client";

import { useCallback } from "react";
import type { WorkoutEquipment, WorkoutFocus, WorkoutPlan } from "@/types";

interface UseWorkoutPlanActionsInput {
  equipment: WorkoutEquipment;
  editablePlan: WorkoutPlan | null;
  updatePlan: (updater: (plan: WorkoutPlan) => WorkoutPlan) => void;
  setSelectedDay: (day: string | null) => void;
}

export function useWorkoutPlanActions({
  equipment,
  editablePlan,
  updatePlan,
  setSelectedDay
}: UseWorkoutPlanActionsInput) {
  const addDay = useCallback(() => {
    let nextName = "Day 1";
    updatePlan((plan) => {
      const nextIndex = plan.days.length + 1;
      nextName = `Day ${nextIndex}`;
      plan.days.push({ name: nextName, focus: "full_body" as WorkoutFocus, exercises: [] });
      return plan;
    });
    setSelectedDay(nextName);
  }, [updatePlan, setSelectedDay]);

  const removeDay = useCallback((dayName: string) => {
    let nextSelected: string | null = null;
    updatePlan((plan) => {
      plan.days = plan.days.filter((day) => day.name !== dayName);
      nextSelected = plan.days[0]?.name ?? null;
      return plan;
    });
    setSelectedDay(nextSelected);
  }, [updatePlan, setSelectedDay]);

  const updateDay = useCallback((dayName: string, updates: { name?: string; focus?: WorkoutFocus }) => {
    let nextSelected = dayName;
    updatePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      if (updates.name) { day.name = updates.name; nextSelected = updates.name; }
      if (updates.focus) { day.focus = updates.focus; }
      return plan;
    });
    setSelectedDay(nextSelected);
  }, [updatePlan, setSelectedDay]);

  const addExercise = useCallback((dayName: string) => {
    updatePlan((plan) => {
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
  }, [updatePlan, equipment]);

  const removeExercise = useCallback((dayName: string, exerciseIndex: number) => {
    updatePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      day.exercises = day.exercises.filter((_, index) => index !== exerciseIndex);
      return plan;
    });
  }, [updatePlan]);

  const updateExercise = useCallback((
    dayName: string,
    index: number,
    updates: Partial<WorkoutPlan["days"][number]["exercises"][number]>
  ) => {
    updatePlan((plan) => {
      const day = plan.days.find((entry) => entry.name === dayName);
      if (!day) return plan;
      const exercise = day.exercises[index];
      if (!exercise) return plan;
      Object.assign(exercise, updates);
      return plan;
    });
  }, [updatePlan]);

  return { addDay, removeDay, updateDay, addExercise, removeExercise, updateExercise };
}
