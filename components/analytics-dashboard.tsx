"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { authedJsonFetch } from "@/lib/api/client";
import type { AnalyticsInsight, AnalyticsMetric, AnalyticsSnapshot } from "@/services/analytics";
import { useEntitlement } from "@/lib/supabase/use-entitlement";
import { PremiumPaywall } from "@/components/premium-paywall";
import { useLanguage } from "@/lib/i18n";

type AnalyticsResponse = AnalyticsSnapshot;

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { entitlement } = useEntitlement();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await authedJsonFetch<AnalyticsResponse>("/api/analytics");
        if (active) setData(payload);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const chartData = useMemo(
    () =>
      (data?.trend ?? []).map((point) => ({
        date: new Date(point.date).toLocaleDateString(),
        weightKg: point.weightKg,
        movingAverageKg: point.movingAverageKg,
        targetBandMinKg: point.targetBandMinKg,
        targetBandMaxKg: point.targetBandMaxKg
      })),
    [data]
  );

  const isLocked = !entitlement || entitlement.tier === "free";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">Progress analytics & insights</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track your weight trend, moving averages, projections, and actionable insights from your logged progress.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/billing" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              {language === "vi" ? "Nâng cấp" : "Upgrade"}
            </Link>
            <button
              type="button"
              disabled={isLocked}
              className="rounded-xl border border-dashed border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-400 transition disabled:cursor-not-allowed disabled:opacity-100"
              title={isLocked ? (language === "vi" ? "Cần Premium để export" : "Premium required to export") : undefined}
            >
              {language === "vi" ? "Export bị khóa" : "Export locked"}
            </button>
            <div className="rounded-2xl border border-border bg-background/55 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-card-foreground">{language === "vi" ? "So sánh nhanh" : "Quick compare"}:</span>
              <span className="ml-2">Free: {language === "vi" ? "biểu đồ ngắn" : "short chart"}</span>
              <span className="mx-2 text-border">|</span>
              <span>Premium: {language === "vi" ? "export + lịch sử dài" : "export + longer history"}</span>
            </div>
            <Link href="/progress" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">
              {language === "vi" ? "Xem tiến độ" : "View progress"}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {data?.metrics?.slice(0, 4).map((metric) => <MetricCard key={metric.label} metric={metric} />) ?? (
              <>
                <MetricCard metric={{ label: "Entries", value: String(data?.entries.length ?? 0), tone: "info" }} />
                <MetricCard metric={{ label: "Weekly change", value: formatChange(data?.weeklyChangeKg), tone: "info" }} />
                <MetricCard metric={{ label: "Target weight", value: formatWeight(data?.targetWeightKg), tone: "info" }} />
                <MetricCard metric={{ label: "Goal", value: data?.goalDirection ?? "—", tone: "info" }} />
              </>
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-border bg-background/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-card-foreground">Trend chart</h2>
              </div>
              <div className="mt-4 h-80">
                {loading ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Loading analytics...</div>
                ) : chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 16, color: "#e2e8f0" }} />
                      <Line type="monotone" dataKey="weightKg" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#0f172a" }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="movingAverageKg" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="targetBandMinKg" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="targetBandMaxKg" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Not enough data yet.</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-background/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-card-foreground">Milestones</h2>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                    {language === "vi" ? "Premium" : "Premium"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {(data?.milestones ?? []).length > 0 ? data?.milestones.map((milestone) => <MilestoneCard key={milestone.label} milestone={milestone} premiumLocked />) : <p className="text-sm text-muted-foreground">Milestones appear after you log a few entries.</p>}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-card-foreground">Insights</h2>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                    {language === "vi" ? "Premium" : "Premium"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {(data?.insights ?? []).length > 0 ? data?.insights.map((insight) => <InsightCard key={insight.title} insight={insight} premiumLocked />) : <p className="text-sm text-muted-foreground">Insights appear after you log a few entries.</p>}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-card-foreground">Nudges & reminders</h2>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                    {language === "vi" ? "Premium" : "Premium"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {(data?.nudges ?? []).length > 0 ? data?.nudges.map((nudge) => <NudgeCard key={nudge.title} nudge={nudge} premiumLocked />) : <p className="text-sm text-muted-foreground">Nudges appear once analytics has enough data.</p>}
                </div>
              </div>
            </div>
          </div>

          {isLocked ? (
            <div className="mt-8">
              <PremiumPaywall title="Unlock deeper analytics" description="Premium unlocks export, longer historical trends, and advanced insight packs." entitlement={entitlement} ctaHref="/billing" ctaLabel="Upgrade for export" secondaryHref="/progress" secondaryLabel="Back to progress" />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const tone = metric.tone === "success" ? "text-primary" : metric.tone === "warning" ? "text-amber-400" : "text-blue-300";
  return (
    <div className="rounded-2xl border border-border bg-background/55 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>{metric.value}</p>
    </div>
  );
}

function PremiumBadge() {
  return <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">Premium</span>;
}

function InsightCard({ insight, premiumLocked = false }: { insight: AnalyticsInsight; premiumLocked?: boolean }) {
  const tone = insight.tone === "success" ? "border-primary/20 bg-primary/10 text-primary" : insight.tone === "warning" ? "border-amber-400/20 bg-amber-400/10 text-amber-400" : "border-blue-400/20 bg-blue-400/10 text-blue-300";
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{insight.title}</p>
        {premiumLocked ? <PremiumBadge /> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.description}</p>
    </div>
  );
}

function MilestoneCard({ milestone, premiumLocked = false }: { milestone: { label: string; targetDate: string; targetWeightKg: number; progressPercent: number; status: "ahead" | "on_track" | "behind" }; premiumLocked?: boolean }) {
  const tone = milestone.status === "on_track" ? "text-primary" : milestone.status === "behind" ? "text-amber-400" : "text-blue-300";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-card-foreground">{milestone.label}</p>
        <div className="flex items-center gap-2">
          {premiumLocked ? <PremiumBadge /> : null}
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>{milestone.status}</span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Target: {milestone.targetWeightKg.toFixed(1)} kg · {new Date(milestone.targetDate).toLocaleDateString()}</p>
      <div className="mt-3 h-2 rounded-full bg-border">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${milestone.progressPercent}%` }} />
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{milestone.progressPercent}%</p>
    </div>
  );
}

function NudgeCard({ nudge, premiumLocked = false }: { nudge: { title: string; description: string; tone: "success" | "warning" | "info" }; premiumLocked?: boolean }) {
  const tone = nudge.tone === "success" ? "border-primary/20 bg-primary/10 text-primary" : nudge.tone === "warning" ? "border-amber-400/20 bg-amber-400/10 text-amber-400" : "border-blue-400/20 bg-blue-400/10 text-blue-300";
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{nudge.title}</p>
        {premiumLocked ? <PremiumBadge /> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{nudge.description}</p>
    </div>
  );
}

function formatWeight(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value.toFixed(1)} kg`;
}

function formatChange(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} kg`;
}
