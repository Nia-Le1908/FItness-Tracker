"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import { authedJsonFetch } from "@/lib/api/client";
import { summarizeProgress } from "@/services/progress-tracker";
import type { WeightEntry } from "@/types";

type ProgressResponse = { entries: WeightEntry[] };

const quickLinks = [
  { href: "/macro", title: "Macro calculator", description: "Calculate calories and macros from your stats." },
  { href: "/meal", title: "Meal planner", description: "Generate budget meals from Vietnamese food data." },
  { href: "/workout", title: "Workout planner", description: "Build a weekly training split and session outline." },
  { href: "/progress", title: "Progress tracking", description: "Add weight entries and review the trend." }
];

export function DashboardOverview() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const summary = summarizeProgress(entries);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      const session = data.session;
      setSignedIn(Boolean(session));

      if (!session) {
        setEntries([]);
        setLoading(false);
        return;
      }

      try {
        const payload = await authedJsonFetch<ProgressResponse>("/api/progress");
        if (active) {
          setEntries(payload.entries);
        }
      } catch {
        if (active) {
          setEntries([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const chartData = entries.map((entry) => ({
    date: new Date(entry.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    weightKg: entry.weightKg
  }));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.14),_transparent_24%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your training, food, and progress in one place</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Use the macro calculator to set targets, feed those numbers into meal planning, and log bodyweight over time.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Session</p>
                <p className="mt-1 font-medium text-foreground">{signedIn ? "Signed in" : "Guest preview"}</p>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 md:grid-cols-3">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-border bg-background/55 p-4 transition hover:border-primary/40 hover:bg-background/70">
                  <p className="text-sm font-semibold text-card-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground sm:text-xl">Progress preview</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Latest weight trend pulled from Supabase when you are signed in.
                </p>
              </div>
              <Link href="/progress" className="text-sm font-medium text-primary hover:underline">
                Open tracker
              </Link>
            </div>

            <div className="mt-5 rounded-3xl border border-border bg-background/50 p-4 sm:p-5">
              {loading ? (
                <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                  Loading progress...
                </div>
              ) : chartData.length > 1 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 16,
                          color: "#e2e8f0"
                        }}
                      />
                      <Line type="monotone" dataKey="weightKg" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#0f172a" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 text-center">
                  <p className="text-sm font-medium text-card-foreground">No progress entries yet</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add your first weight entry to start the trend line.
                  </p>
                  <Link href="/progress" className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                    Add entry
                  </Link>
                </div>
              )}
            </div>

            {summary ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Start" value={`${summary.startWeightKg.toFixed(1)} kg`} />
                <MetricCard label="Current" value={`${summary.currentWeightKg.toFixed(1)} kg`} />
                <MetricCard label="Change" value={`${summary.changeKg > 0 ? "+" : ""}${summary.changeKg.toFixed(1)} kg`} />
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-card-foreground sm:text-xl">Next steps</h2>
            <div className="mt-4 space-y-3">
              <ActionRow href="/macro" title="Calculate macros" description="Enter body fat, goal, and activity level." />
              <ActionRow href="/meal" title="Generate meal plan" description="Use your macro targets and budget to build meals." />
              <ActionRow href="/workout" title="Plan workouts" description="Pick your weekly split and sessions." />
              <ActionRow href="/progress" title="Track progress" description="Store bodyweight and review your trend." />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-card-foreground">{value}</p>
    </div>
  );
}

function ActionRow({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-border bg-background/45 p-4 transition hover:border-primary/40 hover:bg-background/70">
      <p className="text-sm font-semibold text-card-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
