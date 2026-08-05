import { Suspense } from "react";
import { MealPlannerPanel } from "@/components/meal-planner-panel";

export default function MealPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
      <MealPlannerPanel />
    </Suspense>
  );
}
