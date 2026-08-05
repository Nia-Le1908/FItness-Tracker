import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";

export type FriendlyApiError = {
  message: string;
  code: string;
};

type ApiErrorPayload = {
  error?: Partial<FriendlyApiError>;
};

function friendlyApiMessage(payload: unknown, fallback: string) {
  const errorPayload = payload as ApiErrorPayload | undefined;
  const code = errorPayload?.error?.code ?? "";
  const message = errorPayload?.error?.message ?? fallback;

  if (code === "VALIDATION_ERROR") {
    return message;
  }

  if (code === "UNAUTHORIZED") {
    return "Sign in to continue.";
  }

  return message || fallback;
}

export function normalizeUiError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed.";
}

export async function fetchJson<TResponse>(input: RequestInfo | URL, init: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const payload = (await response.json()) as { data: TResponse } | ApiErrorPayload;

  if (!response.ok) {
    throw new Error(friendlyApiMessage(payload, "Request failed."));
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response format.");
  }

  return payload.data;
}

export async function authedJsonFetch<TResponse>(input: RequestInfo | URL, init: RequestInit = {}): Promise<TResponse> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Authentication is not configured for this browser session.");
  }

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

  const payload = (await response.json()) as { data: TResponse } | ApiErrorPayload;

  if (!response.ok) {
    throw new Error(friendlyApiMessage(payload, "Request failed."));
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response format.");
  }

  return payload.data;
}
