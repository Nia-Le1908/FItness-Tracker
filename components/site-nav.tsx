"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/macro", label: "Macro" },
  { href: "/meal", label: "Meal" },
  { href: "/workout", label: "Workout" },
  { href: "/progress", label: "Progress" }
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSignedIn(Boolean(data.session));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            FitBudget
          </Link>

          <div className="flex items-center gap-2 text-sm">
            {signedIn && supabase ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-border bg-card px-3 py-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-border bg-card px-3 py-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  Login
                </Link>
                <Link href="/signup" className="rounded-xl bg-primary px-3 py-2 font-medium text-primary-foreground transition hover:opacity-90">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                pathname === link.href
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
