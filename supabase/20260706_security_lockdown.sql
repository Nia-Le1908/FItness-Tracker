-- security_lockdown.sql
-- A01/A04 fix: prevent privilege-escalation via direct client UPDATE on the
-- users.role column.
-- ============================================================================
-- Background:
--   Supabase exposes PostgREST as the `anon` / `authenticated` role. RLS only
--   filters rows, it does NOT restrict **which columns** a role can read/write.
--   A policy like `users_update_own` with `with check (auth.uid() = id)` would
--   still allow the user to send `UPDATE users SET role = 'admin'`.
--   The fix is to REVOKE UPDATE on the role column from the anon/authenticated
--   PostgREST roles, while keeping the column readable (the UI needs role for
--   the admin badge) and INSERT-able by the owning user.
-- ============================================================================
-- The roles used by PostgREST in Supabase are:
--   anon            -> unauthenticated client requests
--   authenticated   -> JWT-bearing client requests
--   service_role    -> server-side Service Role (bypasses RLS + GRANTs)
-- We revoke the dangerous column grant on `public.users.role` for the two
-- client roles while leaving the Service Role untouched.

-- 1) Make sure the column exists and is well-typed (defensive).
-- If the users table was created from an older schema without the `role`
-- column, add it now before applying guards.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'role'
  ) then
    alter table public.users add column role text not null default 'user';
    alter table public.users add constraint users_role_check
      check (role in ('user', 'support', 'moderator', 'admin'));
  end if;
end $$;

alter table public.users
  alter column role set not null,
  alter column role set default 'user';

-- 2) Revoke ALL privileges on the table from client roles, then re-grant the
--    minimum needed. (PostgREST already grants via the `authenticated` role;
--    we constrain UPDATE specifically.)
revoke update on public.users from anon, authenticated;
revoke insert on public.users from anon, authenticated;

-- 3) Re-grant the WRITE table-level privilege with column restrictions.
--    Allow clients to UPDATE every column EXCEPT `role`.
--    Supabase handles this via `grant update (col1, col2, ...)`.
grant update (full_name, avatar_url, height_cm, birth_date, sex, goal, daily_budget_vnd, email, updated_at)
  on public.users to authenticated;

-- Allow upsert on id for idempotent auth flow (requireAuth ensures a user row
-- exists). The `id` column on CONFLICT is safe: it cannot be escalated.
-- The column guard trigger (guard_user_role_insert) further enforces that
-- role='user' on any authenticated insert.
grant update (id)
  on public.users to authenticated;

-- Allow clients to INSERT their own row, but NOT set the role column directly.
-- (Inserts with role=NULL will fall back to the column default 'user'.)
grant insert (id, full_name, email, avatar_url, height_cm, birth_date, sex, goal, daily_budget_vnd)
  on public.users to authenticated;

-- 4) Allow clients to read their own row (linking)
grant select on public.users to anon, authenticated;

-- 5) Re-grant the modification privileges on the table for completeness.
--    We do NOT re-grant update(role) or insert(role).
--    The Service Role (`service_role`) is unaffected and can still set role.

-- 6) Belt-and-suspenders: add a trigger that refuses role changes originating
--    from any role OTHER than service_role. This survives even if someone later
--    accidentally re-grants update(role) to authenticated.
create or replace function public.guard_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_setting text;
begin
  -- The request.jwt.claims injected by PostgREST include role. The session
  -- role for client requests is either `anon` or `authenticated`. The Service
  -- Role bypasses RLS AND uses `service_role`.
  current_setting := current_setting('role', true);

  if current_setting is not null and current_setting in ('anon', 'authenticated') then
    -- Block role changes from client requests. Allow them only from
    -- service_role / postgres / superuser contexts (server-side).
    if new.role is distinct from old.role then
      raise exception 'Permission denied: cannot modify users.role from client request';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists users_guard_role on public.users;
create trigger users_guard_role
before update of role on public.users
for each row
execute function public.guard_user_role();

-- Also guard INSERTs that come from client context: force role -> 'user' if
-- the request is from anon/authenticated.
create or replace function public.guard_user_role_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_setting text;
begin
  current_setting := current_setting('role', true);

  if current_setting is not null and current_setting in ('anon', 'authenticated') then
    new.role := 'user';
  end if;

  return new;
end;
$$;

drop trigger if exists users_guard_role_insert on public.users;
create trigger users_guard_role_insert
before insert on public.users
for each row
execute function public.guard_user_role_insert();

select pg_notify('pgrst', 'reload schema');
