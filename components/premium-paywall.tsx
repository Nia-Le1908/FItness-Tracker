"use client";

import Link from "next/link";

import type { EntitlementState } from "@/lib/billing";
import { canAccessPremium } from "@/lib/billing";

export function PremiumPaywall({
  title,
  description,
  ctaHref = "/billing",
  ctaLabel = "Upgrade",
  secondaryHref = "/dashboard",
  secondaryLabel = "Back to dashboard",
  entitlement
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  entitlement?: EntitlementState | null;
}) {
  const hasAccess = canAccessPremium(entitlement);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand opacity-20 blur-2xl" />
      <div className="relative flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          <span className="mr-1" aria-hidden>👑</span>
          Premium
        </p>
        {hasAccess ? (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            ✨ Active
          </span>
        ) : (
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Free
          </span>
        )}
      </div>
      <h2 className="relative mt-2 text-2xl font-bold text-card-foreground">{title}</h2>
      <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="relative mt-5 flex flex-wrap gap-3">
        <Link href={hasAccess ? "/billing" : ctaHref} className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition ease-spring hover:-translate-y-0.5">
          {hasAccess ? "Manage subscription" : ctaLabel}
        </Link>
        <Link href={secondaryHref} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition ease-spring hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted">
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
