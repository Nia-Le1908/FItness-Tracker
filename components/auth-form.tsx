"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setMessage("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.");
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (data.session) {
        router.replace("/");
      }
    });

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!supabase) {
      setMessage("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.");
      setLoading(false);
      return;
    }

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login`
            }
          });

    const { error } = await action;

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (mode === "login") {
      router.replace("/");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            {mode === "login" ? "Welcome back" : "Create account"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-card-foreground">
            {mode === "login" ? "Login to FitBudget" : "Sign up for FitBudget"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Access your meal plans, progress, and macros."
              : "Start tracking your nutrition with a Supabase-backed account."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-muted-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </button>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <a href={mode === "login" ? "/signup" : "/login"} className="hover:text-foreground">
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </a>
        </div>
      </div>
    </div>
  );
}
