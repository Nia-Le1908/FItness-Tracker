"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useEntitlement } from "@/lib/supabase/use-entitlement";
import { useSupabaseSession } from "@/lib/supabase/use-supabase-session";
import { cn } from "@/lib/utils";
import { useUiFeedback } from "@/lib/ui-feedback";

type PaymentAttempt = { id: string; provider: string; plan: string; order_code: string; payment_link_id: string | null; status: "created" | "pending" | "paid" | "failed" | "canceled"; amount_vnd: number; currency: string; checkout_url: string | null; created_at: string; updated_at: string };
type TimelineItem = { title: string; description: string; status: string; createdAt: string };
const gatewayLabels: Record<string, string> = { payos: "PayOS", vnpay: "VNPay", momo: "MoMo", zalopay: "ZaloPay" };
const planMatrix = [{ name: "Free", price: "0đ", perks: ["Basic dashboard", "Progress tracking", "Limited analytics"], active: true }, { name: "Premium", price: "99k / month", perks: ["Unlimited history", "Advanced analytics", "Exports", "Priority support"], active: false }, { name: "Annual", price: "999k / year", perks: ["Everything in Premium", "Best value", "Annual billing", "Fewer payment interruptions"], active: false }];

function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gateway = searchParams.get("gateway") ?? "payos";
  const plan = searchParams.get("plan") ?? "premium";
  const gatewayLabel = gatewayLabels[gateway] ?? "PayOS";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [history, setHistory] = useState<PaymentAttempt[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { entitlement } = useEntitlement();
  const { supabase, signedIn } = useSupabaseSession();
  const { pushNotice, setBanner } = useUiFeedback();

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      if (!signedIn || !supabase) { setHistory([]); setTimeline([]); return; }
      setHistoryLoading(true); setHistoryError(null);
      try {
        const session = await supabase.auth.getSession(); const token = session.data.session?.access_token;
        const response = await fetch("/api/billing/history", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const payload = (await response.json()) as { data?: { attempts?: PaymentAttempt[]; timeline?: TimelineItem[] }; error?: { message?: string } };
        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Unable to load billing history.");
        }
        if (!active) return;
        setHistory(payload.data?.attempts ?? []); setTimeline(payload.data?.timeline ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load billing history.";
        if (active) setHistoryError(message);
        pushNotice({ title: "Billing history error", message, tone: "error" });
        setBanner({ title: "Billing history error", message, tone: "error" });
      } finally { if (active) setHistoryLoading(false); }
    }
    loadHistory(); return () => { active = false; };
  }, [signedIn, supabase, pushNotice, setBanner]);

  async function handleCheckout(nextPlan: "premium" | "annual") {
    setLoadingPlan(nextPlan);
    try {
      const session = signedIn && supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token ?? null;
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan: nextPlan, gateway }) });
      const payload = (await response.json()) as { data?: { checkoutUrl?: string; payment?: { checkoutUrl?: string } }; error?: { message?: string; code?: string } };
      if (!response.ok) { throw new Error(payload.error?.message ?? "Unable to start checkout."); }
      const checkoutUrl = payload.data?.payment?.checkoutUrl ?? payload.data?.checkoutUrl;
      pushNotice({ title: "Checkout started", message: `Opening ${gatewayLabel} checkout for ${nextPlan}.`, tone: "success" });
      setBanner({ title: "Checkout started", message: `Opening ${gatewayLabel} checkout for ${nextPlan}.`, tone: "success" });
      if (checkoutUrl) { window.location.href = checkoutUrl; return; }
      router.push(`/billing/callback?provider=${gateway}&plan=${nextPlan}&status=success`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      pushNotice({ title: "Checkout error", message, tone: "error" });
      setBanner({ title: "Checkout error", message, tone: "error" });
    } finally { setLoadingPlan(null); }
  }

  async function handleAction(action: "retry" | "renew" | "cancel") {
    try {
      if (action === "retry" || action === "renew") { await handleCheckout(entitlement.tier === "annual" ? "annual" : "premium"); return; }
      if (!signedIn || !supabase) { router.push("/login"); return; }
      const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; if (!token) { router.push("/login"); return; }
      const response = await fetch("/api/billing/cancel", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ provider: gateway, plan: entitlement.tier }) });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) { throw new Error(payload.error?.message ?? "Unable to cancel subscription."); }
      pushNotice({ title: "Plan canceled", message: "Your subscription was canceled.", tone: "warning" });
      setBanner({ title: "Plan canceled", message: "Your subscription was canceled.", tone: "warning" });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel subscription.";
      pushNotice({ title: "Subscription error", message, tone: "error" });
      setBanner({ title: "Subscription error", message, tone: "error" });
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/80 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Billing</p>
          <h1 className="mt-2 text-3xl font-semibold">Nâng cấp gói của bạn</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gói hiện tại: {entitlement.tier} • Gateway: {gatewayLabel}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {planMatrix.map((item) => {
            const tierKey = item.name.toLowerCase();
            const isCurrentPlan = tierKey === entitlement.tier;
            const isSelectedPlan = tierKey === plan;
            const canUpgradeToPlan = tierKey === "premium" || tierKey === "annual";
            const nextPlan = tierKey === "annual" ? "annual" : "premium";

            return (
              <div key={item.name} className={cn("rounded-3xl border p-6 shadow-soft", isSelectedPlan ? "border-primary bg-primary/10" : "border-border bg-surface/80")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{item.name}</h2>
                    <p className="mt-2 text-2xl font-bold">{item.price}</p>
                  </div>
                  {isCurrentPlan ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Current</span> : null}
                </div>

                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {item.perks.map((perk) => <li key={perk}>• {perk}</li>)}
                </ul>

                {canUpgradeToPlan ? (
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleCheckout(nextPlan as "premium" | "annual")}
                      disabled={loadingPlan === nextPlan}
                      className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingPlan === nextPlan ? "Đang mở checkout..." : item.name === "Premium" ? "Upgrade to Premium" : "Upgrade to Annual"}
                    </button>
                    {isCurrentPlan ? (
                      <button
                        type="button"
                        onClick={() => handleAction("renew")}
                        className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-muted"
                      >
                        Renew plan
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-6 text-sm text-muted-foreground">Free plan currently active.</div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading billing...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
