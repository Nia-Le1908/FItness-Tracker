"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { authedJsonFetch } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import { summarizeProgress } from "@/services/progress-tracker";
import type { WeightEntry } from "@/types";

type ProgressResponse = { entries: WeightEntry[] };

export function ProgressTracker() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

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
          setWeight(String(payload.entries.at(-1)?.weightKg ?? ""));
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load progress entries.");
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

  const summary = summarizeProgress(entries);
  const currentWeight = entries.at(-1)?.weightKg;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const weightValue = Number(weight);
    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      setError("Enter a valid weight.");
      return;
    }

    if (!supabase) {
      setError("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to save progress.");
      return;
    }

    if (!signedIn) {
      setError("Sign in to save progress entries.");
      return;
    }

    setSaving(true);

    try {
      const payload = await authedJsonFetch<ProgressResponse>("/api/progress", {
        method: "POST",
        body: JSON.stringify({ weightKg: weightValue, recordedAt: new Date().toISOString() })
      });

      setEntries(payload.entries);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Progress tracking</p>
              <h1 className="mt-2 text-2xl font-semibold text-card-foreground sm:text-3xl">Add weight and review the trend</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Entries are stored in Supabase and charted with Recharts.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current weight</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{currentWeight ? `${currentWeight.toFixed(1)} kg` : "--"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block space-y-2 text-sm">
              <span className="text-muted-foreground">Weight (kg)</span>
              <input
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                inputMode="decimal"
                type="number"
                step="0.1"
                min="0"
                placeholder="72.4"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
              />
            </label>

            <button
              type="submit"
              disabled={saving || loading}
              className="mt-auto rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add entry"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Entries" value={String(entries.length)} />
            <StatCard label="Change" value={summary ? `${summary.changeKg > 0 ? "+" : ""}${summary.changeKg.toFixed(1)} kg` : "--"} />
            <StatCard label="Trend" value={summary ? `${summary.percentChange > 0 ? "+" : ""}${summary.percentChange.toFixed(1)}%` : "--"} />
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-background/50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-card-foreground">Weight trend</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your Supabase progress entries plotted over time.</p>
              </div>
              <div className="text-right text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {signedIn ? "Synced" : "Sign in required"}
              </div>
            </div>

            <div className="mt-5 h-72">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                  Loading progress...
                </div>
              ) : !signedIn ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                  Sign in to load and save progress entries.
                </div>
              ) : chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                  Add at least two entries to see the chart.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-card-foreground">{value}</p>
    </div>
  );
}
