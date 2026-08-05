"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { authedJsonFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";
import { freeFeatureLimits } from "@/lib/premium";
import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";
import { summarizeProgress } from "@/services/progress-tracker";
import type { WeightEntry } from "@/types";
import { PremiumPaywall } from "@/components/premium-paywall";
import { useEntitlement } from "@/lib/supabase/use-entitlement";

type ProgressResponse = { entries: WeightEntry[] };
type AnalyticsSummary = {
  weeklyChangeKg: number | null;
  monthlyChangeKg: number | null;
  weeklyAdherencePercent: number | null;
  monthlyAdherencePercent: number | null;
  goalDirection: "cut" | "maintain" | "bulk";
  targetWeightKg?: number | null;
};

export function DashboardOverview() {
  const { language } = useLanguage();
  const s = strings.dashboard;
  const { supabase, signedIn, loading: sessionLoading } = useSupabaseSession();
  const { entitlement } = useEntitlement();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const summary = summarizeProgress(entries);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      if (!signedIn) {
        setEntries([]);
        setAnalytics(null);
        setLoading(false);
        return;
      }

      try {
        const [progressPayload, analyticsPayload] = await Promise.all([
          authedJsonFetch<ProgressResponse>("/api/progress"),
          authedJsonFetch<AnalyticsSummary>("/api/analytics")
        ]);
        if (active) {
          setEntries(progressPayload.entries);
          setAnalytics(analyticsPayload);
        }
      } catch {
        if (active) {
          setEntries([]);
          setAnalytics(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [signedIn, supabase]);

  const chartData = entries.slice(-freeFeatureLimits.dashboardEntriesPreview).map((entry) => ({
    date: new Date(entry.date).toLocaleString(language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    weightKg: entry.weightKg
  }));

  const quickLinks = useMemo(
    () => [
      { href: "/macro", title: t(strings.dashboard.calculateMacros, language), description: language === "vi" ? "Nhập body fat, goal và activity level." : "Enter body fat, goal, and activity level.", emoji: "🔥", gradient: "from-fuchsia-500/20 to-purple-500/10" },
      { href: "/meal", title: t(strings.dashboard.generateMealPlan, language), description: language === "vi" ? "Dùng mục tiêu macro và budget để tạo bữa ăn." : "Use your macro targets and budget to build meals.", emoji: "🍽️", gradient: "from-cyan-500/20 to-blue-500/10" },
      { href: "/workout", title: t(strings.dashboard.planWorkouts, language), description: language === "vi" ? "Chọn split tuần và buổi tập." : "Pick your weekly split and sessions.", emoji: "💪", gradient: "from-rose-500/20 to-orange-500/10" },
      { href: "/progress", title: t(strings.dashboard.trackProgress, language), description: language === "vi" ? "Lưu cân nặng và xem xu hướng." : "Store bodyweight and review your trend.", emoji: "📈", gradient: "from-emerald-500/20 to-teal-500/10" }
    ],
    [language]
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[2rem] border border-border glass shadow-card animate-slide-up">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand opacity-20 blur-3xl animate-float" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent opacity-20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  <span className="mr-1" aria-hidden>✨</span>
                  {t(s.eyebrow, language)}
                </p>
                <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  <span className="text-gradient">{t(s.heroTitle, language)}</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t(s.heroDescription, language)}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t(s.sessionLabel, language)}</p>
                <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
                  <span className={cn("h-2 w-2 rounded-full", sessionLoading ? "bg-yellow-400 animate-pulse" : signedIn ? "bg-primary animate-pulse-glow" : "bg-muted-foreground")} />
                  {sessionLoading ? t(s.sessionChecking, language) : signedIn ? t(s.sessionSignedIn, language) : t(s.sessionGuest, language)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/analytics" className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground">
                    {language === "vi" ? "Phân tích" : "Analytics"}
                  </Link>
                  <Link href="/settings" className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground">
                    {language === "vi" ? "Cài đặt" : "Settings"}
                  </Link>
                  <Link href="/billing" className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground">
                    Billing
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 md:grid-cols-3">
              {quickLinks.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="stagger group relative overflow-hidden rounded-2xl border border-border bg-background/55 p-4 transition ease-spring hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 transition group-hover:opacity-100", item.gradient)} />
                  <div className="relative">
                    <span className="text-2xl" aria-hidden>{item.emoji}</span>
                    <p className="mt-2 text-sm font-semibold text-card-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* PROGRESS CHART */}
          <section className="rounded-[2rem] border border-border glass p-5 shadow-card sm:p-6 animate-slide-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground sm:text-xl">
                  <span className="mr-1.5" aria-hidden>📈</span>
                  {t(s.progressPreview, language)}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(s.progressDesc, language)}</p>
              </div>
              <Link href="/progress" className="text-sm font-medium text-primary transition hover:underline">
                {t(s.openTracker, language)} →
              </Link>
            </div>

            <div className="mt-5 rounded-3xl border border-border bg-background/50 p-4 sm:p-5">
              {loading ? (
                <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                  <span className="mr-2 animate-spin">⏳</span>
                  {t(s.loadingProgress, language)}
                </div>
              ) : chartData.length > 1 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 16, color: "hsl(var(--popover-foreground))" }} />
                      <defs>
                        <linearGradient id="weightLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--accent))" />
                        </linearGradient>
                      </defs>
                      <Line type="monotone" dataKey="weightKg" stroke="url(#weightLine)" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--card))" }} activeDot={{ r: 6, style: { filter: "drop-shadow(0 0 6px hsl(var(--primary)))" } }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 text-center">
                  <span className="text-3xl" aria-hidden>🌱</span>
                  <p className="mt-3 text-sm font-medium text-card-foreground">{t(s.noEntries, language)}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(s.noEntriesDesc, language)}</p>
                  <Link href="/progress" className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95">
                    {t(s.addEntry, language)} →
                  </Link>
                </div>
              )}
            </div>

            {summary ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label={language === "vi" ? "Bắt đầu" : "Start"} value={`${summary.startWeightKg.toFixed(1)} kg`} />
                <MetricCard label={language === "vi" ? "Hiện tại" : "Current"} value={`${summary.currentWeightKg.toFixed(1)} kg`} />
                <MetricCard label={language === "vi" ? "Thay đổi" : "Change"} value={`${summary.changeKg > 0 ? "+" : ""}${summary.changeKg.toFixed(1)} kg`} accent />
              </div>
            ) : null}
          </section>

          {/* NEXT STEPS */}
          <section className="rounded-[2rem] border border-border glass p-5 shadow-card sm:p-6 animate-slide-up">
            <h2 className="text-lg font-semibold text-card-foreground sm:text-xl">
              <span className="mr-1.5" aria-hidden>🚀</span>
              {t(s.nextSteps, language)}
            </h2>
            <div className="mt-4 space-y-3">
              <ActionRow href="/macro" title={t(strings.dashboard.calculateMacros, language)} description={language === "vi" ? "Nhập body fat, goal và activity level." : "Enter body fat, goal, and activity level."} emoji="🔥" />
              <ActionRow href="/meal" title={t(strings.dashboard.generateMealPlan, language)} description={language === "vi" ? "Dùng mục tiêu macro và budget để tạo bữa ăn." : "Use your macro targets and budget to build meals."} emoji="🍽️" />
              <ActionRow href="/workout" title={t(strings.dashboard.planWorkouts, language)} description={language === "vi" ? "Chọn split tuần và buổi tập." : "Pick your weekly split and sessions."} emoji="💪" />
              <ActionRow href="/progress" title={t(strings.dashboard.trackProgress, language)} description={language === "vi" ? "Lưu cân nặng và xem xu hướng." : "Store bodyweight and review your trend."} emoji="📈" />
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">📊 Analytics summary</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MiniMetric label="Goal" value={analytics?.goalDirection ?? "—"} />
                <MiniMetric label="Weekly adherence" value={analytics?.weeklyAdherencePercent === null || analytics?.weeklyAdherencePercent === undefined ? "—" : `${analytics.weeklyAdherencePercent}%`} />
                <MiniMetric label="Monthly adherence" value={analytics?.monthlyAdherencePercent === null || analytics?.monthlyAdherencePercent === undefined ? "—" : `${analytics.monthlyAdherencePercent}%`} />
                <MiniMetric label="Target weight" value={analytics?.targetWeightKg ? `${analytics.targetWeightKg.toFixed(1)} kg` : "—"} />
              </div>
            </div>

            <div className="mt-6">
              <PremiumPaywall title="Unlock premium analytics" description="See deeper analytics, full history, and premium productivity tools." entitlement={entitlement} ctaHref="/billing" ctaLabel="Upgrade to premium" secondaryHref="/settings" secondaryLabel="Back to settings" />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4 transition hover:-translate-y-0.5", accent ? "border-primary/40 bg-primary/10" : "border-border bg-background/50")}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-lg font-semibold", accent ? "text-gradient" : "text-card-foreground")}>{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-card-foreground">{value}</p>
    </div>
  );
}

function ActionRow({ href, title, description, emoji }: { href: string; title: string; description: string; emoji: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl border border-border bg-background/45 p-4 transition ease-spring hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
      <span className="text-2xl transition group-hover:scale-110" aria-hidden>{emoji}</span>
      <div>
        <p className="text-sm font-semibold text-card-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
