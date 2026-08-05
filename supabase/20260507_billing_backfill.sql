-- 20260507_billing_backfill.sql
-- Backfill billing data for an existing admin user.
-- Creates a public.users row if missing, then seeds billing_entitlements as premium/active.
--
-- WARNING: This migration contains an environment-specific email. Replace
-- 'haing190806@gmail.com' below with the admin email for YOUR environment
-- before running this migration in a new database.
-- For production: this migration was already applied; do not modify it.
-- For new deployments: use a separate seed script with env-variable config.

create extension if not exists pgcrypto;

do $$
declare
  target_user_id uuid;
  target_email text := 'haing190806@gmail.com';
begin
  select id
    into target_user_id
  from auth.users
  where email = target_email
  limit 1;

  if target_user_id is null then
    raise exception 'No auth.users row found for email: %', target_email;
  end if;

  insert into public.users (
    id,
    email,
    role,
    goal,
    updated_at
  )
  values (
    target_user_id,
    target_email,
    'admin',
    'maintain',
    timezone('utc', now())
  )
  on conflict (id) do update
    set email = excluded.email,
        role = 'admin',
        goal = coalesce(public.users.goal, 'maintain'),
        updated_at = timezone('utc', now());

  insert into public.billing_entitlements (
    user_id,
    tier,
    status,
    source,
    current_period_end,
    product_id,
    customer_id,
    stripe_subscription_id,
    updated_at
  )
  values (
    target_user_id,
    'premium',
    'active',
    'manual',
    null,
    'admin-seeded',
    null,
    'admin-seeded',
    timezone('utc', now())
  )
  on conflict (user_id) do update
    set tier = 'premium',
        status = 'active',
        source = 'manual',
        product_id = excluded.product_id,
        customer_id = excluded.customer_id,
        stripe_subscription_id = excluded.stripe_subscription_id,
        updated_at = timezone('utc', now());

  insert into public.audit_events (
    actor_user_id,
    actor_role,
    target_type,
    target_id,
    action,
    summary,
    payload
  )
  values (
    target_user_id,
    'admin',
    'user',
    target_user_id::text,
    'backfill_admin_premium',
    'Backfilled admin role and premium entitlement',
    jsonb_build_object(
      'email', target_email,
      'tier', 'premium',
      'status', 'active',
      'source', 'manual'
    )
  );
end $$;

select pg_notify('pgrst', 'reload schema');
