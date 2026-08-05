import { Suspense } from "react";
import { WorkoutPlannerPanel } from "@/components/workout-planner-panel";

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
      <WorkoutPlannerPanel />
    </Suspense>
  );
}
