import { createSupabaseRouteClient } from "@/lib/supabase/route-client";

/**
 * Authenticate a request using the Bearer token from the Authorization header.
 * Returns the authenticated supabase client and user id.
 * Also ensures a matching row exists in the public.users table.
 */
export async function requireAuth(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  const accessToken = scheme === "Bearer" && token ? token : undefined;

  const supabase = createSupabaseRouteClient(accessToken);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized.");
  }

  const userId = data.user.id;

  // Ensure a user profile row exists (upsert)
  const { error: upsertError } = await supabase
    .from("users")
    .upsert({ id: userId }, { onConflict: "id" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return { supabase, userId };
}