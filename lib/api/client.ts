import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";

export async function fetchJson<TResponse>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const payload = (await response.json()) as
    | { data: TResponse }
    | { error: { message: string; code: string } };

  if (!response.ok) {
    const errorMessage = "error" in payload ? payload.error.message : "Request failed.";
    throw new Error(errorMessage);
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response format.");
  }

  return payload.data;
}

export async function authedJsonFetch<TResponse>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<TResponse> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session?.access_token) {
    throw new Error("Sign in to continue.");
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      ...(init.headers ?? {})
    }
  });

  const payload = (await response.json()) as
    | { data: TResponse }
    | { error: { message: string; code: string } };

  if (!response.ok) {
    const errorMessage = "error" in payload ? payload.error.message : "Request failed.";
    throw new Error(errorMessage);
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response format.");
  }

  return payload.data;
}
