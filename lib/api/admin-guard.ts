import { requireAuth } from "@/lib/api/auth-guard";
import { canAccessAdmin, canManageUserRoles } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ForbiddenError } from "@/lib/api/route-errors";

export async function requireAdmin(request: Request) {
  const auth = await requireAuth(request);
  const { data } = await auth.supabase.from("users").select("role").eq("id", auth.userId).single();

  if (!canAccessAdmin(data?.role ?? null)) {
    throw new ForbiddenError();
  }

  const adminSupabase = createSupabaseServerClient();
  return { supabase: adminSupabase, userId: auth.userId, role: data?.role ?? "user" };
}

export async function requireFullAdmin(request: Request) {
  const auth = await requireAuth(request);
  const { data } = await auth.supabase.from("users").select("role").eq("id", auth.userId).single();

  if (!canManageUserRoles(data?.role ?? null)) {
    throw new ForbiddenError("Only full admins can manage user roles.");
  }

  const adminSupabase = createSupabaseServerClient();
  return { supabase: adminSupabase, userId: auth.userId, role: data?.role ?? "user" };
}
