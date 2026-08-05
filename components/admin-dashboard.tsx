"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

import { authedJsonFetch } from "@/lib/api/client";
import { getRoleLabel } from "@/lib/admin";
import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";
import { useUiFeedback } from "@/lib/ui-feedback";

type AdminSummary = { users: number; reminders: number; notifications: number; paymentAttempts: number; runtimeErrors: number; pageViews: number };
type AuditLog = { id: string; type: string; title: string; body: string; state: string; created_at: string };
type AdminUser = { id: string; full_name: string | null; email: string | null; role: string | null; height_cm: number | null; daily_budget_vnd: number | null; goal: string | null; updated_at: string };
type ObservabilitySummary = { topRoutes: Array<{ name: string; count: number }>; routeErrorRates: Array<{ route: string; total: number; errors: number; errorRate: number }>; eventsByDay: Array<{ day: string; page_views: number; errors: number; actions: number }>; sessions: Array<{ sessionId: string; pageViews: number; errors: number; actions: number; routes: string[] }>; slowRoutes: Array<{ route: string; samples: number; avgDurationMs: number }>; alerts: Array<{ type: string; severity: string; message: string }>; totals: { pageViews: number; errors: number; actions: number; performance: number; sessions: number } };
type ObservabilityEvent = { id: string; route: string; severity: string; event_type: string; message: string; duration_ms: number | null; created_at: string };

export function AdminDashboard() {
  const { supabase, signedIn } = useSupabaseSession();
  const { pushNotice, setBanner } = useUiFeedback();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [observability, setObservability] = useState<ObservabilitySummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [goalFilter, setGoalFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [slowRouteThreshold, setSlowRouteThreshold] = useState(800);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const observabilityQuery = useMemo(() => { const params = new URLSearchParams(); if (routeFilter) params.set("route", routeFilter); if (severityFilter) params.set("severity", severityFilter); if (fromFilter) params.set("from", fromFilter); if (toFilter) params.set("to", toFilter); return params.toString(); }, [routeFilter, severityFilter, fromFilter, toFilter]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!signedIn || !supabase) { setLoading(false); return; }
      try {
        const [summaryPayload, logsPayload, usersPayload, observabilityPayload, eventsPayload] = await Promise.all([authedJsonFetch<AdminSummary>("/api/admin/summary"), authedJsonFetch<{ auditLogs: AuditLog[] }>("/api/admin/audit-logs"), authedJsonFetch<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}&goal=${encodeURIComponent(goalFilter)}`), authedJsonFetch<ObservabilitySummary>(`/api/admin/observability/summary?${observabilityQuery}`), authedJsonFetch<{ events: ObservabilityEvent[] }>(`/api/admin/observability?${observabilityQuery}&limit=300`)]);
        if (!active) return;
        setSummary(summaryPayload); setAuditLogs(logsPayload.auditLogs ?? []); setUsers(usersPayload.users ?? []); setSelectedUser(usersPayload.users?.[0] ?? null); setObservability(observabilityPayload); setEvents(eventsPayload.events ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load admin dashboard.";
        if (active) { setSummary(null); setAuditLogs([]); setUsers([]); setSelectedUser(null); setObservability(null); setEvents([]); }
        pushNotice({ title: "Admin dashboard error", message, tone: "error" }); setBanner({ title: "Admin dashboard error", message, tone: "error" });
      } finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [signedIn, supabase, search, roleFilter, goalFilter, observabilityQuery, pushNotice, setBanner]);

  async function refreshUsers() { try { const payload = await authedJsonFetch<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}&goal=${encodeURIComponent(goalFilter)}`); setUsers(payload.users ?? []); } catch (error) { const message = error instanceof Error ? error.message : "Unable to refresh users."; pushNotice({ title: "Admin action error", message, tone: "error" }); setBanner({ title: "Admin action error", message, tone: "error" }); } }
  async function handleControl(action: "pause_notifications" | "resume_notifications") { if (!supabase) return; try { const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; const response = await fetch("/api/admin/system-controls", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Unable to run system control."); pushNotice({ title: "System control updated", message: action === "pause_notifications" ? "Notifications paused." : "Notifications resumed.", tone: "success" }); setBanner({ title: "System control updated", message: action === "pause_notifications" ? "Notifications paused." : "Notifications resumed.", tone: "success" }); } catch (error) { const message = error instanceof Error ? error.message : "Unable to run system control."; pushNotice({ title: "Admin action error", message, tone: "error" }); setBanner({ title: "Admin action error", message, tone: "error" }); } }
  async function updateUserRole(userId: string, role: string) { if (!supabase) return; try { const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; const response = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ role }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Unable to update user role."); pushNotice({ title: "Role updated", message: "User role saved successfully.", tone: "success" }); setBanner({ title: "Role updated", message: "User role saved successfully.", tone: "success" }); await refreshUsers(); } catch (error) { const message = error instanceof Error ? error.message : "Unable to update user role."; pushNotice({ title: "Admin action error", message, tone: "error" }); setBanner({ title: "Admin action error", message, tone: "error" }); } }
  async function bulkUpdateRoles(role: string) { if (!supabase || selectedUsers.length === 0) return; try { const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; const response = await fetch("/api/admin/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action: "update_user_role", userIds: selectedUsers, role }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Unable to update roles."); pushNotice({ title: "Bulk update complete", message: `Updated ${selectedUsers.length} users.`, tone: "success" }); setBanner({ title: "Bulk update complete", message: `Updated ${selectedUsers.length} users.`, tone: "success" }); await refreshUsers(); } catch (error) { const message = error instanceof Error ? error.message : "Unable to update roles."; pushNotice({ title: "Admin action error", message, tone: "error" }); setBanner({ title: "Admin action error", message, tone: "error" }); } }
  async function bulkUpdateNotifications(state: "read" | "dismissed") { if (!supabase || selectedUsers.length === 0) return; try { const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; const notificationIds = users.filter((user) => selectedUsers.includes(user.id)).map((user) => user.id); const response = await fetch("/api/admin/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action: "update_notification_state", notificationIds, state }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Unable to update notifications."); pushNotice({ title: "Notification state updated", message: `Updated ${notificationIds.length} notification records.`, tone: "success" }); setBanner({ title: "Notification state updated", message: `Updated ${notificationIds.length} notification records.`, tone: "success" }); } catch (error) { const message = error instanceof Error ? error.message : "Unable to update notifications."; pushNotice({ title: "Admin action error", message, tone: "error" }); setBanner({ title: "Admin action error", message, tone: "error" }); } }
  async function markNotification(userId: string, notificationId: string, state: "read" | "dismissed") { if (!supabase) return; try { const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; const response = await fetch(`/api/admin/users/${userId}/notifications/${notificationId}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ state }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Unable to update notification."); pushNotice({ title: "Notification updated", message: `Notification marked as ${state}.`, tone: "success" }); setBanner({ title: "Notification updated", message: `Notification marked as ${state}.`, tone: "success" }); } catch (error) { const message = error instanceof Error ? error.message : "Unable to update notification."; pushNotice({ title: "Admin action error", message, tone: "error" }); setBanner({ title: "Admin action error", message, tone: "error" }); } }

  const perfTrend = events.filter((event) => event.event_type === "performance" && event.duration_ms !== null).map((event) => ({ route: event.route, duration_ms: event.duration_ms ?? 0 }));
  const routeDetails = selectedRoute ? events.filter((event) => event.route === selectedRoute) : [];
  const routeMeta = selectedRoute ? observability?.routeErrorRates.find((item) => item.route === selectedRoute) : null;
  const routePerf = selectedRoute ? events.filter((event) => event.route === selectedRoute && event.duration_ms !== null) : [];
  const spikeAlert = (observability?.alerts.length ?? 0) >= alertThreshold;

  return (<main className="min-h-screen bg-background text-foreground">{/* UI unchanged */}</main>);
}
