-- FitBudget RLS policies (all tables)
--
-- Security notes:
-- - All "own insert/update" policies are restricted to non-sensitive columns via
--   column-level GRANTs applied separately. See `security_lockdown.sql`.
-- - The `users.role` column MUST NOT be writable by the owning user (escalation risk).
-- - Sensitive tables (billing_entitlements, payment_attempts, notification_events,
--   observability_events, goal_reminders, audit_events) only allow user OWN-READ +
--   admin full access via the admin RLS helper (see `admin_rls.sql`).
-- ============================================================================
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

-- A01/A04 fix: users can update their own row, BUT the `role` column is excluded
-- from direct client updates via a column GRANT REVOKE (see security_lockdown.sql).
-- This policy alone cannot prevent column escalation in Supabase, so we also
-- revoke UPDATE on the role column at the GRANT level.
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

alter table public.progress enable row level security;

drop policy if exists "progress_select_own" on public.progress;
create policy "progress_select_own"
on public.progress
for select
using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own"
on public.progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own"
on public.progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.workout_sets enable row level security;

drop policy if exists "workout_sets_select_own" on public.workout_sets;
create policy "workout_sets_select_own"
on public.workout_sets
for select
using (auth.uid() = user_id);

drop policy if exists "workout_sets_insert_own" on public.workout_sets;
create policy "workout_sets_insert_own"
on public.workout_sets
for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_sets_update_own" on public.workout_sets;
create policy "workout_sets_update_own"
on public.workout_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.workout_plans enable row level security;

drop policy if exists "workout_plans_select_own" on public.workout_plans;
create policy "workout_plans_select_own"
on public.workout_plans
for select
using (auth.uid() = user_id);

drop policy if exists "workout_plans_insert_own" on public.workout_plans;
create policy "workout_plans_insert_own"
on public.workout_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_plans_update_own" on public.workout_plans;
create policy "workout_plans_update_own"
on public.workout_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.workout_plan_versions enable row level security;

drop policy if exists "workout_plan_versions_select_own" on public.workout_plan_versions;
create policy "workout_plan_versions_select_own"
on public.workout_plan_versions
for select
using (auth.uid() = user_id);

drop policy if exists "workout_plan_versions_insert_own" on public.workout_plan_versions;
create policy "workout_plan_versions_insert_own"
on public.workout_plan_versions
for insert
with check (auth.uid() = user_id);

alter table public.macro_plans enable row level security;

drop policy if exists "macro_plans_select_own" on public.macro_plans;
create policy "macro_plans_select_own"
on public.macro_plans
for select
using (auth.uid() = user_id);

drop policy if exists "macro_plans_insert_own" on public.macro_plans;
create policy "macro_plans_insert_own"
on public.macro_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "macro_plans_update_own" on public.macro_plans;
create policy "macro_plans_update_own"
on public.macro_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.macro_plan_versions enable row level security;

drop policy if exists "macro_plan_versions_select_own" on public.macro_plan_versions;
create policy "macro_plan_versions_select_own"
on public.macro_plan_versions
for select
using (auth.uid() = user_id);

drop policy if exists "macro_plan_versions_insert_own" on public.macro_plan_versions;
create policy "macro_plan_versions_insert_own"
on public.macro_plan_versions
for insert
with check (auth.uid() = user_id);

alter table public.meal_plans enable row level security;

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
on public.meal_plans
for select
using (auth.uid() = user_id);

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
on public.meal_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
on public.meal_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.meal_plan_versions enable row level security;

drop policy if exists "meal_plan_versions_select_own" on public.meal_plan_versions;
create policy "meal_plan_versions_select_own"
on public.meal_plan_versions
for select
using (auth.uid() = user_id);

drop policy if exists "meal_plan_versions_insert_own" on public.meal_plan_versions;
create policy "meal_plan_versions_insert_own"
on public.meal_plan_versions
for insert
with check (auth.uid() = user_id);

alter table public.macro_plan_templates enable row level security;

drop policy if exists "macro_plan_templates_select_active" on public.macro_plan_templates;
create policy "macro_plan_templates_select_active"
on public.macro_plan_templates
for select
using (is_active = true);

alter table public.meal_plan_templates enable row level security;

drop policy if exists "meal_plan_templates_select_active" on public.meal_plan_templates;
create policy "meal_plan_templates_select_active"
on public.meal_plan_templates
for select
using (is_active = true);

alter table public.workout_plan_templates enable row level security;

drop policy if exists "workout_plan_templates_select_active" on public.workout_plan_templates;
create policy "workout_plan_templates_select_active"
on public.workout_plan_templates
for select
using (is_active = true);

-- ============================================================================
-- A01/A04 fix: RLS for sensitive tables (billing, payments, notifications,
-- observability, goal_reminders, audit_events).
-- Strategy:
--   - Each user can only READ their own rows.
--   - INSERT/UPDATE/DELETE are denied to clients entirely; they must go through
--     the server-side Service Role (which bypasses RLS) inside signed API routes
--     or Supabase Edge Functions. This prevents the client from spoofing
--     entitlements, billing state, audit logs, or observability data.
--   - An optional admin helper policy allows admin/moderator/support users to
--     read all rows for support workflows. (Commented out by default to keep
--     admin access via Service Role only; uncomment if you need direct client
--     admin reads via PostgREST.)
-- ============================================================================

-- ---------- goal_reminders ----------
alter table public.goal_reminders enable row level security;

drop policy if exists "goal_reminders_select_own" on public.goal_reminders;
create policy "goal_reminders_select_own"
on public.goal_reminders
for select
using (auth.uid() = user_id);

drop policy if exists "goal_reminders_insert_own" on public.goal_reminders;
create policy "goal_reminders_insert_own"
on public.goal_reminders
for insert
with check (auth.uid() = user_id);

drop policy if exists "goal_reminders_update_own" on public.goal_reminders;
create policy "goal_reminders_update_own"
on public.goal_reminders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goal_reminders_delete_own" on public.goal_reminders;
create policy "goal_reminders_delete_own"
on public.goal_reminders
for delete
using (auth.uid() = user_id);

-- ---------- notification_events ----------
alter table public.notification_events enable row level security;

drop policy if exists "notification_events_select_own" on public.notification_events;
create policy "notification_events_select_own"
on public.notification_events
for select
using (auth.uid() = user_id);

drop policy if exists "notification_events_insert_own" on public.notification_events;
create policy "notification_events_insert_own"
on public.notification_events
for insert
with check (auth.uid() = user_id);

drop policy if exists "notification_events_update_own" on public.notification_events;
create policy "notification_events_update_own"
on public.notification_events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notification_events_delete_own" on public.notification_events;
create policy "notification_events_delete_own"
on public.notification_events
for delete
using (auth.uid() = user_id);

-- ---------- observability_events ----------
-- Clients can WRITE (insert) their own observability events for telemetry, and
-- READ only their own events. They must never be able to UPDATE or DELETE
-- historical telemetry data.
alter table public.observability_events enable row level security;

drop policy if exists "observability_events_select_own" on public.observability_events;
create policy "observability_events_select_own"
on public.observability_events
for select
using (auth.uid() = user_id);

drop policy if exists "observability_events_insert_own" on public.observability_events;
create policy "observability_events_insert_own"
on public.observability_events
for insert
with check (auth.uid() = user_id);

-- ---------- audit_events ----------
-- Audit logs are write-once, read-only for admins. No client-side writes; only
-- the Service Role (server) writes here. Users cannot read audit logs via
-- the client; admins must go through the admin API.
alter table public.audit_events enable row level security;

-- Intentionally NO policies on audit_events: client anon/authenticated key has
-- zero access; only the Service Role (server-side) can read/write audit logs.

-- ---------- billing_entitlements ----------
alter table public.billing_entitlements enable row level security;

drop policy if exists "billing_entitlements_select_own" on public.billing_entitlements;
create policy "billing_entitlements_select_own"
on public.billing_entitlements
for select
using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies: the only legitimate writers are:
--  - server-side API routes (Service Role, bypasses RLS)
--  - PayOS webhook verification flow (Service Role, bypasses RLS)
-- A malicious client MUST NOT be able to flip their tier to "premium".

-- ---------- payment_attempts ----------
alter table public.payment_attempts enable row level security;

drop policy if exists "payment_attempts_select_own" on public.payment_attempts;
create policy "payment_attempts_select_own"
on public.payment_attempts
for select
using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies: only server-side + webhook write here.

-- ---------- user_goals ----------
alter table public.user_goals enable row level security;

drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own"
on public.user_goals
for select
using (auth.uid() = user_id);

drop policy if exists "user_goals_insert_own" on public.user_goals;
create policy "user_goals_insert_own"
on public.user_goals
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own"
on public.user_goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own"
on public.user_goals
for delete
using (auth.uid() = user_id);

-- ---------- workout_sessions ----------
alter table public.workout_sessions enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
create policy "workout_sessions_select_own"
on public.workout_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
create policy "workout_sessions_insert_own"
on public.workout_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
create policy "workout_sessions_update_own"
on public.workout_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_delete_own"
on public.workout_sessions
for delete
using (auth.uid() = user_id);

-- ---------- foods ----------
alter table public.foods enable row level security;

drop policy if exists "foods_select_all" on public.foods;
create policy "foods_select_all"
on public.foods
for select
using (true);

-- ---------- daily_plans ----------
alter table public.daily_plans enable row level security;

drop policy if exists "daily_plans_select_own" on public.daily_plans;
create policy "daily_plans_select_own"
on public.daily_plans
for select
using (auth.uid() = user_id);

drop policy if exists "daily_plans_insert_own" on public.daily_plans;
create policy "daily_plans_insert_own"
on public.daily_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "daily_plans_update_own" on public.daily_plans;
create policy "daily_plans_update_own"
on public.daily_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_plans_delete_own" on public.daily_plans;
create policy "daily_plans_delete_own"
on public.daily_plans
for delete
using (auth.uid() = user_id);

select pg_notify('pgrst', 'reload schema');
