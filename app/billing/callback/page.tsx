"use client";

import Link from "next/link";
import { use, useEffect } from "react";

import { useUiFeedback } from "@/lib/ui-feedback";

type CallbackStatus = "success" | "cancel" | "failed" | "pending";

const statusConfig: Record<CallbackStatus, { title: string; tone: "success" | "warning" | "error" | "info"; message: string }> = {
  success: { title: "Payment successful", tone: "success", message: "Your entitlement should update shortly after webhook confirmation." },
  cancel: { title: "Payment canceled", tone: "warning", message: "You can retry the checkout anytime from the billing page." },
  failed: { title: "Payment failed", tone: "error", message: "Please try again or choose another gateway." },
  pending: { title: "Payment pending", tone: "info", message: "We are waiting for the gateway confirmation and webhook callback." }
};

type SearchParamsRecord = Record<string, string | string[] | undefined>;

export default function BillingCallbackPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  // React 19 `use` hook: resolves the async searchParams promise. The fallback
  // `Promise.resolve<SearchParamsRecord>({})` keeps the union type strict so
  // `resolvedSearchParams.provider` is type-checked (avoiding the "{}" narrowing
  // from a literal empty object).
  const resolvedSearchParams = use<SearchParamsRecord>(searchParams ?? Promise.resolve<SearchParamsRecord>({}));

  const provider = typeof resolvedSearchParams.provider === "string" ? resolvedSearchParams.provider : "payos";
  const plan = typeof resolvedSearchParams.plan === "string" ? resolvedSearchParams.plan : "premium";
  const statusValue = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "success";
  const status = (statusValue === "cancel" || statusValue === "failed" || statusValue === "pending" ? statusValue : "success") as CallbackStatus;
  const config = statusConfig[status];
  const { pushNotice, setBanner } = useUiFeedback();

  useEffect(() => {
    pushNotice({ title: config.title, message: config.message, tone: config.tone });
    setBanner({ title: config.title, message: config.message, tone: config.tone });
  }, [config.message, config.tone, config.title, pushNotice, setBanner]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Billing callback</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${config.tone === "success" ? "text-primary" : config.tone === "warning" ? "text-amber-400" : config.tone === "error" ? "text-red-400" : "text-card-foreground"}`}>{config.title}</h1>
            <StatusPill status={status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Provider: <span className="font-medium text-card-foreground">{provider}</span> · Plan: <span className="font-medium text-card-foreground">{plan}</span>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoCard label="Provider" value={provider.toUpperCase()} />
            <InfoCard label="Plan" value={plan} />
            <InfoCard label="Status" value={status} />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background/50 p-5">
            <p className={config.tone === "success" ? "text-primary" : config.tone === "warning" ? "text-amber-400" : config.tone === "error" ? "text-red-400" : "text-card-foreground"}>{config.message}</p>
            <p className="mt-2 text-sm text-muted-foreground">If the payment was completed, your billing entitlement will refresh automatically after webhook processing.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/billing" className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">Back to billing</Link>
            <Link href="/dashboard" className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted">Go to dashboard</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: CallbackStatus }) {
  const tone = status === "success" ? "border-primary/30 bg-primary/10 text-primary" : status === "pending" ? "border-amber-400/30 bg-amber-400/10 text-amber-400" : status === "failed" ? "border-red-400/30 bg-red-400/10 text-red-400" : "border-border bg-background text-muted-foreground";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>{status}</span>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/55 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-card-foreground">{value}</p>
    </div>
  );
}
