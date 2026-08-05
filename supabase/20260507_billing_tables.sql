-- 20260507_billing_tables.sql
-- Billing tables for FitBudget:
-- - billing_entitlements
-- - payment_attempts
-- Includes triggers, indexes, and comments.

create extension if not exists pgcrypto;

-- =========================================================
-- billing_entitlements
-- =========================================================

create table if not exists public.billing_entitlements (
  user_id uuid primary key references public.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'premium', 'annual')),
  status text not null default 'inactive' check (status in ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  source text not null default 'none' check (source in ('manual', 'stripe', 'payos', 'localStorage', 'none')),
  current_period_end timestamptz,
  product_id text,
  customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists billing_entitlements_set_updated_at on public.billing_entitlements;
create trigger billing_entitlements_set_updated_at
before update on public.billing_entitlements
for each row execute function public.set_updated_at();

create index if not exists idx_billing_entitlements_tier
  on public.billing_entitlements (tier);

create index if not exists idx_billing_entitlements_status
  on public.billing_entitlements (status);

comment on table public.billing_entitlements is
  'Current billing entitlement state for a user, including plan tier and subscription status.';

comment on column public.billing_entitlements.user_id is
  'Owning user ID. One entitlement row per user.';

comment on column public.billing_entitlements.tier is
  'Subscription tier: free, premium, or annual.';

comment on column public.billing_entitlements.status is
  'Entitlement state: active, trialing, past_due, canceled, or inactive.';

comment on column public.billing_entitlements.source is
  'Source of entitlement truth: manual, stripe, payos, localStorage, or none.';

comment on column public.billing_entitlements.current_period_end is
  'Timestamp when the current subscription period ends, if available.';

comment on column public.billing_entitlements.product_id is
  'External product or payment identifier associated with the entitlement.';

comment on column public.billing_entitlements.customer_id is
  'External customer identifier associated with the entitlement.';

comment on column public.billing_entitlements.stripe_subscription_id is
  'External subscription identifier. Kept generic for both PayOS and Stripe-compatible flows.';

comment on column public.billing_entitlements.created_at is
  'Row creation timestamp in UTC.';

comment on column public.billing_entitlements.updated_at is
  'Row last update timestamp in UTC.';


-- =========================================================
-- payment_attempts
-- =========================================================

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('payos', 'vnpay', 'momo', 'zalopay')),
  plan text not null check (plan in ('premium', 'annual')),
  order_code text not null,
  payment_link_id text,
  status text not null check (status in ('created', 'pending', 'paid', 'failed', 'canceled')),
  amount_vnd integer not null check (amount_vnd >= 0),
  currency text not null default 'VND' check (currency = 'VND'),
  checkout_url text,
  raw_request jsonb,
  raw_response jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists payment_attempts_set_updated_at on public.payment_attempts;
create trigger payment_attempts_set_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

create index if not exists idx_payment_attempts_user_created
  on public.payment_attempts (user_id, created_at desc);

create index if not exists idx_payment_attempts_order_code
  on public.payment_attempts (order_code);

-- A02 fix: unique constraint on (provider, order_code) is required for
-- idempotent webhook processing. Without it, replays would create duplicates
-- or overwrite newer state with older state.
-- Note: this only works if order_code is unique per provider. For PayOS the
-- webhook payload always carries provider='payos' + a unique orderCode.
create unique index if not exists uq_payment_attempts_provider_order_code
  on public.payment_attempts (provider, order_code);

create index if not exists idx_payment_attempts_provider_status
  on public.payment_attempts (provider, status);

create index if not exists idx_payment_attempts_provider_created
  on public.payment_attempts (provider, created_at desc);

comment on table public.payment_attempts is
  'History of checkout/payment attempts for billing providers such as PayOS and VNPay.';

comment on column public.payment_attempts.id is
  'Primary key for the payment attempt row.';

comment on column public.payment_attempts.user_id is
  'Owning user ID for the payment attempt.';

comment on column public.payment_attempts.provider is
  'Payment gateway/provider used for the attempt.';

comment on column public.payment_attempts.plan is
  'Requested billing plan, usually premium or annual.';

comment on column public.payment_attempts.order_code is
  'External order code used by the payment provider. Stored as text for compatibility.';

comment on column public.payment_attempts.payment_link_id is
  'Provider-issued payment link ID, if any.';

comment on column public.payment_attempts.status is
  'Attempt status: created, pending, paid, failed, or canceled.';

comment on column public.payment_attempts.amount_vnd is
  'Attempt amount in Vietnamese dong.';

comment on column public.payment_attempts.currency is
  'Currency code, fixed to VND.';

comment on column public.payment_attempts.checkout_url is
  'Checkout URL returned by the provider or mock flow.';

comment on column public.payment_attempts.raw_request is
  'Raw request payload sent to the provider or mock mode.';

comment on column public.payment_attempts.raw_response is
  'Raw response payload received from the provider or mock mode.';

comment on column public.payment_attempts.created_at is
  'Row creation timestamp in UTC.';

comment on column public.payment_attempts.updated_at is
  'Row last update timestamp in UTC.';

select pg_notify('pgrst', 'reload schema');
