import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "sb-fitbudget-auth-token";

let browserClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Auth] Missing env vars. URL:", !!supabaseUrl, "Key:", !!supabaseAnonKey);
    return null;
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: STORAGE_KEY
    }
  });

  return browserClient;
}

export function clearBrowserClient() {
  browserClient = null;
}
