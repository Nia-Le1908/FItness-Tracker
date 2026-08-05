import type { PayOSPlan } from "@/lib/payments/payos";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentAttemptStatus = "created" | "pending" | "paid" | "failed" | "canceled";
export type PaymentAttemptProvider = "payos" | "vnpay" | "momo" | "zalopay";

export type PaymentAttempt = {
  id?: string;
  userId: string;
  provider: PaymentAttemptProvider;
  plan: PayOSPlan;
  orderCode: string;
  paymentLinkId?: string | null;
  status: PaymentAttemptStatus;
  amountVnd: number;
  currency: "VND";
  checkoutUrl?: string | null;
  rawRequest?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export function createPaymentAttempt(input: PaymentAttempt): PaymentAttempt {
  const now = new Date().toISOString();
  return {
    ...input,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
}

/**
 * A01/A09 fix: write an immutable audit_events row via the Service Role client.
 * Used by webhook + admin mutation routes to leave a trail of who did what.
 *
 * Failures are swallowed (logged) so a broken audit log does not block the
 * primary operation; the primary write has already happened by the time this
 * is called. Callers SHOULD check the returned boolean if audit failure must
 * block the operation.
 */
export type AuditEventInput = {
  actorUserId: string | null;
  actorRole?: string | null;
  targetType: string;
  targetId: string;
  action: string;
  summary: string;
  payload?: Record<string, unknown> | null;
};

export async function createAuditEvent(
  supabase: SupabaseClient,
  input: AuditEventInput
): Promise<boolean> {
  try {
    const { error } = await supabase.from("audit_events").insert({
      actor_user_id: input.actorUserId,
      actor_role: input.actorRole ?? null,
      target_type: input.targetType,
      target_id: input.targetId,
      action: input.action,
      summary: input.summary,
      payload: input.payload ?? {},
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("[audit] failed to write audit event", { action: input.action, message: error.message });
      return false;
    }
    return true;
  } catch (err) {
    console.error("[audit] threw while writing audit event", { action: input.action, err });
    return false;
  }
}
