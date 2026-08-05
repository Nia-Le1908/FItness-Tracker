"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { authedJsonFetch } from "@/lib/api/client";
import { useApiFeedback } from "@/lib/api/feedback";
import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";
import { THEME_OPTIONS, getThemeOption } from "@/lib/theme";
import { useTheme } from "@/components/theme-toggle";

type Reminder = { id: string; goal: "cut" | "maintain" | "bulk"; title: string; message: string; cadence: "weekly" | "monthly" | "event"; channel: "in_app" | "email" | "push"; is_enabled: boolean };
type NotificationEvent = { id: string; title: string; body: string; type: string; state: string; created_at: string };
type ProfilePayload = { goal?: "cut" | "maintain" | "bulk"; full_name?: string | null; email?: string | null; height_cm?: number | null; daily_budget_vnd?: number | null; weight_kg?: number | null; body_fat_percent?: number | null; activity_level?: string | null; sex?: string | null };
type ProfileGoal = "cut" | "maintain" | "bulk";

export function SettingsDashboard() {
  const { supabase, signedIn } = useSupabaseSession();
  const { notifyApiError, notifyApiSuccess } = useApiFeedback();
  const [profile, setProfile] = useState<ProfilePayload>({ goal: "maintain" });
  const [goal, setGoal] = useState<ProfileGoal>("maintain");
  const [cadence, setCadence] = useState<Reminder["cadence"]>("weekly");
  const [channel, setChannel] = useState<Reminder["channel"]>("in_app");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const userId = supabase?.auth?.getSession ? (await supabase.auth.getSession()).data.session?.user.id ?? null : null;
      if (!signedIn || !supabase || !userId) {
        hasLoadedRef.current = false;
        lastUserIdRef.current = null;
        setLoading(false);
        return;
      }

      if (hasLoadedRef.current && lastUserIdRef.current === userId) {
        setLoading(false);
        return;
      }

      hasLoadedRef.current = true;
      lastUserIdRef.current = userId;

      try {
        const [profileResponse, reminderPayload, eventPayload] = await Promise.all([
          supabase.from("users").select("full_name,email,height_cm,daily_budget_vnd,goal,weight_kg,body_fat_percent,activity_level,sex").eq("id", userId).single(),
          authedJsonFetch<{ reminders: Reminder[] }>("/api/goal-reminders"),
          authedJsonFetch<{ events: NotificationEvent[] }>("/api/notification-events")
        ]);
        if (!active) return;
        const profileData = profileResponse.data as { goal?: string; full_name?: string | null; email?: string | null; height_cm?: number | null; daily_budget_vnd?: number | null; weight_kg?: number | null; body_fat_percent?: number | null; activity_level?: string | null; sex?: string | null } | null;
        const currentProfile = { goal: (profileData?.goal as ProfileGoal | undefined) ?? "maintain", full_name: profileData?.full_name ?? null, email: profileData?.email ?? null, height_cm: profileData?.height_cm ?? null, daily_budget_vnd: profileData?.daily_budget_vnd ?? null, weight_kg: profileData?.weight_kg ?? null, body_fat_percent: profileData?.body_fat_percent ?? null, activity_level: profileData?.activity_level ?? null, sex: profileData?.sex ?? null };
        setProfile(currentProfile);
        setGoal(currentProfile.goal ?? "maintain");
        setReminders(reminderPayload.reminders ?? []);
        setEvents(eventPayload.events ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load settings.";
        notifyApiError("Settings error", message);
        if (active) {
          setReminders([]);
          setEvents([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [signedIn, supabase, notifyApiError]);

  const activeReminder = useMemo(() => reminders[0] ?? null, [reminders]);

  const { theme, setTheme, mounted: themeMounted } = useTheme();
  const activeTheme = getThemeOption(theme);

  async function saveSettings() {
    if (!supabase) return;
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      // Build a concrete HeadersInit object (avoiding `Authorization?: undefined`
      // in the spread union, which is invalid for the fetch() typing).
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const goalResponse = await fetch("/api/settings/goal", { method: "PUT", headers, body: JSON.stringify({ goal, channel }) });
      if (!goalResponse.ok) throw await goalResponse.json();

      // Cast `supabase` to a wider client to bypass the missing Database type
      // inference for the `users` table. The `.from("users")` call returns
      // `never` otherwise, causing upsert to fail type-checking.
      const db = supabase as unknown as { from: (table: string) => { upsert: (...args: any[]) => any } };
      const profileResult = await db.from("users").upsert({ id: session.data.session?.user.id, full_name: profile.full_name, email: profile.email, height_cm: profile.height_cm, daily_budget_vnd: profile.daily_budget_vnd, goal, weight_kg: profile.weight_kg, body_fat_percent: profile.body_fat_percent, activity_level: profile.activity_level, sex: profile.sex }, { onConflict: "id" });
      if (profileResult.error) throw new Error(profileResult.error.message);

      const reminderResponse = await fetch("/api/goal-reminders", { method: "POST", headers, body: JSON.stringify({ goal, title: `${goal.toUpperCase()} check-in`, message: "Stay consistent with your progress plan.", cadence, channel, isEnabled: true }) });
      if (!reminderResponse.ok) throw await reminderResponse.json();
      const refreshedReminders = await authedJsonFetch<{ reminders: Reminder[] }>("/api/goal-reminders");
      const refreshedEvents = await authedJsonFetch<{ events: NotificationEvent[] }>("/api/notification-events");
      setReminders(refreshedReminders.reminders ?? []);
      setEvents(refreshedEvents.events ?? []);
      notifyApiSuccess("Settings saved", "Your profile and reminders were updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save settings.";
      notifyApiError("Save failed", message);
    } finally {
      setSaving(false);
    }
  }

  async function triggerReminder() {
    if (!supabase || !activeReminder) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const response = await fetch("/api/notification-events", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: "reminder", title: activeReminder.title, body: activeReminder.message, state: "queued", payload: { goal: activeReminder.goal, cadence: activeReminder.cadence, channel: activeReminder.channel }, reminderId: activeReminder.id, scheduledAt: new Date().toISOString() }) });
    if (!response.ok) {
      const payload = await response.json();
      const message = payload?.error?.message ?? "Unable to create notification.";
      notifyApiError("Notification error", message);
      return;
    }
    const refreshed = await authedJsonFetch<{ events: NotificationEvent[] }>("/api/notification-events");
    setEvents(refreshed.events ?? []);
    notifyApiSuccess("Reminder queued", "A notification event was created.");
  }

  async function runScheduler() {
    if (!supabase) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      notifyApiError("Scheduler error", "You must be signed in to run the scheduler.");
      return;
    }

    const cronSecret = process.env.NODE_ENV === "development" ? token : null;
    const response = await fetch("/api/notifications/cron", { method: "POST", headers: { "Content-Type": "application/json", ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}), "X-Debug-User": token } });
    if (!response.ok) {
      notifyApiError("Scheduler error", "Unable to run notification scheduler.");
      return;
    }
    notifyApiSuccess("Scheduler started", "Notification scheduler executed successfully.");
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Cài đặt</p>
              <h1 className="mt-2 text-3xl font-semibold">Quản lý mục tiêu, nhắc nhở và thông báo</h1>
            </div>
            <button onClick={saveSettings} disabled={saving} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Giao diện</p>
              <h2 className="mt-2 text-xl font-semibold">Chọn theme</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {themeMounted
                  ? `Đang dùng: ${activeTheme.label.vi} — ${activeTheme.description.vi}`
                  : "Đang tải tuỳ chọn theme..."}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const selected = themeMounted && option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={
                    "flex items-start gap-3 rounded-2xl border p-3 text-left transition " +
                    (selected
                      ? "border-primary/60 bg-primary/10 text-primary shadow-glow"
                      : "border-border bg-card/60 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground")
                  }
                  aria-pressed={selected}
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-lg"
                    style={{ background: option.swatch }}
                    aria-hidden
                  >
                    <span className="drop-shadow">{option.emoji}</span>
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold">{option.label.vi}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{option.description.vi}</span>
                  </span>
                  {selected ? <span className="mt-1" aria-hidden>✓</span> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Hồ sơ</h2>
            <p className="mt-2 text-sm text-muted-foreground">Trạng thái: {loading ? "Đang tải..." : signedIn ? "Đã đăng nhập" : "Chưa đăng nhập"}</p>
            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Tên hiển thị</span>
                <input
                  type="text"
                  value={profile.full_name ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  value={profile.email ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ban@example.com"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Chiều cao (cm)</span>
                <input
                  type="number"
                  value={profile.height_cm ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, height_cm: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="175"
                  min={0}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Ngân sách hằng ngày (VND)</span>
                <input
                  type="number"
                  value={profile.daily_budget_vnd ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, daily_budget_vnd: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="100000"
                  min={0}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Cân nặng (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={profile.weight_kg ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, weight_kg: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="72"
                  min={0}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Body fat (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={profile.body_fat_percent ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, body_fat_percent: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="18"
                  min={0}
                  max={60}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Mức hoạt động</span>
                <select
                  value={profile.activity_level ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, activity_level: e.target.value || null }))}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">-- Chưa chọn --</option>
                  <option value="sedentary">Ít vận động</option>
                  <option value="light">Nhẹ</option>
                  <option value="moderate">Vừa phải</option>
                  <option value="active">Năng động</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Giới tính</span>
                <select
                  value={profile.sex ?? ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, sex: e.target.value || null }))}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">-- Chưa chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>
              <fieldset className="flex flex-col gap-1.5 text-sm">
                <legend className="font-medium">Mục tiêu</legend>
                <div className="flex flex-wrap gap-2">
                  {(["cut", "maintain", "bulk"] as const).map((g) => (
                    <label
                      key={g}
                      className={
                        "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition " +
                        (goal === g
                          ? "border-primary/60 bg-primary/15 text-primary shadow-glow"
                          : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      }
                    >
                      <input
                        type="radio"
                        name="goal"
                        value={g}
                        checked={goal === g}
                        onChange={(e) => setGoal(e.target.value as ProfileGoal)}
                        className="sr-only"
                      />
                      {g === "cut" ? "Cut fat" : g === "maintain" ? "Maintain" : "Lean bulk"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Nhắc nhở</h2>
            <p className="mt-2 text-sm text-muted-foreground">{reminders.length} reminder(s) • {events.length} event(s)</p>
            <div className="mt-4 space-y-3 text-sm">
              {reminders.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-muted-foreground">{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
