import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Creates a Supabase client with SERVICE_ROLE privileges. This bypasses ALL
 * Row Level Security. Only use this client when:
 *
 *   - Processing webhooks (PayOS signature verification)
 *   - Running cron / background jobs (notifications)
 *   - Admin operations after role verification (requireAdmin guard)
 *   - Billing writes (checkout, cancel, entitlement updates)
 *   - Anonymous telemetry ingest (observability POST)
 *
 * NEVER use this client for user-scoped reads. Use `createSupabaseRouteClient`
 * or `createSupabaseAnonClient` for those operations.
 */
export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}