"use client";

import { useEffect, useState } from "react";
import type { WorkoutTemplate } from "@/types";
import { fetchJson } from "@/lib/api/client";
import { HomeIcon, DumbbellIcon, FlameIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";

interface Props {
  onUsePlan: (plan: import("@/types").WorkoutPlan, templateName: string) => void;
}

export function TemplateGallery({ onUsePlan }: Props) {
  const { language } = useLanguage();
  const w = strings.workout;
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded || templates.length > 0) return;
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const payload = await fetchJson<WorkoutTemplate[]>("/api/workout-templates?limit=12");
        if (active) setTemplates(Array.isArray(payload) ? payload : []);
      } catch {
        if (active) setError("Unable to load templates.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [expanded, templates.length]);

  const goalColors: Record<string, string> = {
    cut: "bg-orange-500/15 text-orange-400",
    maintain: "bg-blue-500/15 text-blue-400",
    bulk: "bg-green-500/15 text-green-400"
  };

  const expLabels: Record<string, string> = {
    beginner: language === "vi" ? "Sơ cấp" : "Beginner",
    intermediate: language === "vi" ? "Trung cấp" : "Intermediate",
    advanced: language === "vi" ? "Cao cấp" : "Advanced"
  };

  function handleUseTemplate(template: WorkoutTemplate) {
    onUsePlan(template.plan, template.name);
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:bg-card/40"
      >
        <div className="flex items-center gap-2">
          <HomeIcon className="size-5 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">
            {language === "vi" ? "Giáo án mẫu" : "Browse Templates"}
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {templates.length > 0 ? templates.length : "..."}
          </span>
        </div>
        <span className="text-xs text-muted-foreground transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          ▼
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-border px-5 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : templates.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-card-foreground">{template.name}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${goalColors[template.goal] ?? "bg-muted text-muted-foreground"}`}>
                        {template.goal}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground line-clamp-2">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {expLabels[template.experienceLevel] ?? template.experienceLevel}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {template.daysPerWeek}d/wk
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {template.equipment.replace("_", " ")}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {template.plan.totalExercises} ex
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
                  >
                    <DumbbellIcon className="size-4" />
                    {language === "vi" ? "Dùng giáo án này" : "Use this plan"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "vi" ? "Chưa có giáo án mẫu nào." : "No templates available yet."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
