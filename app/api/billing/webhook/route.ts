import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonSuccess } from "@/lib/api/http";
import { jsonError } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import {
  extractPayOSWebhookData,
  getPayOSWebhookSignatureCandidates,
  normalizePayOSStatus,
  verifyPayOSWebhookSignature
} from "@/lib/payments/payos";
import { createAuditEvent } from "@/lib/payments/payment-audit";

type PaymentAttemptRow = {
  id: string;
  status: string;
  order_code: string;
  provider: string;
};

const TERMINAL_STATUSES = new Set(["paid", "failed", "canceled"]);

/**
 * Webhook handler for PayOS payment notifications.
 *
 * Security model (idempotency):
 *   - HMAC signature is verified against the raw body before any DB write.
 *   - We look up an existing `payment_attempts` row by (provider, order_code).
 *   - If a row already exists in a TERMINAL state (paid/failed/canceled),
 *     we short-circuit and return success without re-processing — this makes
 *     the webhook idempotent against replays (network retries, PayOS resend,
 *     or attacker replays if `checksum_key` ever leaks later).
 *   - Only the FIRST terminal webhook wins; subsequent ones are no-ops.
 *   - Every accepted webhook writes an `audit_events` row for traceability.
 *
 * Returns 200 with `received: true, verified: true` on success, or 200 with
 * `received: true, verified: true, replayed: true` for safe replays.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-payos-signature");

    if (!rawBody.trim()) {
      return handleApiError(new Error("Empty webhook payload."), "Empty webhook payload.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return handleApiError(new Error("Invalid webhook payload."), "Invalid webhook payload.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    if (typeof payload !== "object" || payload === null) {
      return handleApiError(new Error("Invalid webhook payload."), "Invalid webhook payload.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    const signatureCandidates = getPayOSWebhookSignatureCandidates(rawBody, payload as Record<string, unknown>);
    const verified = verifyPayOSWebhookSignature(rawBody, signature) || signatureCandidates.includes(signature ?? "");

    if (!verified) {
      console.error("[webhook] signature verification failed", {
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") ?? "unknown"
      });
      return jsonSuccess({ received: false, verified: false });
    }

    const supabase = createSupabaseServerClient();
    const data = extractPayOSWebhookData(payload as Record<string, unknown>);

    if (!data.userId || !data.plan || !data.status) {
      return handleApiError(new Error("Missing webhook billing fields."), "Missing webhook billing fields.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    const normalizedStatus = normalizePayOSStatus(data.status);
    const tier = data.plan === "annual" ? "annual" : "premium";
    const orderCode = data.orderCode ? String(data.orderCode) : null;

    // ---- Idempotency check ---------------------------------------------------
    // If we already have a terminal-state attempt for this (provider, orderCode),
    // treat the webhook as a replay and DO NOT re-process. Replay-safe return.
    if (orderCode) {
      const { data: existing, error: lookupError } = await supabase
        .from("payment_attempts")
        .select("id,status")
        .eq("provider", "payos")
        .eq("order_code", orderCode)
        .maybeSingle<PaymentAttemptRow>();

      if (lookupError) {
        throw lookupError;
      }

      if (existing && TERMINAL_STATUSES.has(existing.status)) {
        // Replay detected — respond 200 so PayOS stops retrying, but no-op.
        await createAuditEvent(supabase, {
          actorUserId: data.userId,
          targetType: "payment_attempt",
          targetId: existing.id,
          action: "webhook_replay_skipped",
          summary: `Ignored replayed webhook for terminal payment ${orderCode}`,
          payload: { orderCode, previousStatus: existing.status }
        });
        return jsonSuccess({ received: true, verified: true, replayed: true });
      }
    }

    const attemptStatus =
      normalizedStatus === "active" ? "paid" :
      normalizedStatus === "trialing" ? "pending" :
      normalizedStatus === "canceled" ? "canceled" : "failed";

    // ---- Persist the attempt + entitlement --------------------------------
    const attemptPayload = {
      user_id: data.userId,
      provider: "payos" as const,
      plan: tier,
      order_code: orderCode ?? "unknown",
      payment_link_id: data.paymentLinkId ?? null,
      status: attemptStatus,
      amount_vnd: Number(data.amount ?? 0),
      currency: "VND" as const,
      checkout_url: null,
      raw_request: null,
      raw_response: payload,
      updated_at: new Date().toISOString()
    };

    let attemptId: string | null = null;

    if (orderCode) {
      // First write: insert. If the unique (provider, order_code) constraint
      // hits a race with a concurrent webhook, fall back to "do nothing" and
      // surface the existing row id for the audit log.
      const { data: inserted, error: insertError } = await supabase
        .from("payment_attempts")
        .upsert(attemptPayload, { onConflict: "provider,order_code" })
        .select("id")
        .single<PaymentAttemptRow>();

      if (insertError) {
        // 23505 = unique_violation — concurrent webhook won.
        if (insertError.code === "23505") {
          return jsonSuccess({ received: true, verified: true, replayed: true });
        }
        throw insertError;
      }

      attemptId = inserted?.id ?? null;
    } else {
      // No order_code — best-effort insert with a generated id.
      const { data: inserted, error: insertError } = await supabase
        .from("payment_attempts")
        .insert(attemptPayload)
        .select("id")
        .single<PaymentAttemptRow>();

      if (insertError) {
        throw insertError;
      }
      attemptId = inserted?.id ?? null;
    }

    await supabase.from("billing_entitlements").upsert({
      user_id: data.userId,
      tier: normalizedStatus === "active" || normalizedStatus === "trialing" ? tier : "free",
      status: normalizedStatus,
      source: "payos",
      current_period_end: data.expiredAt ? new Date(Number(data.expiredAt) * 1000).toISOString() : null,
      product_id: data.productId,
      customer_id: data.customerId,
      stripe_subscription_id: orderCode,
      updated_at: new Date().toISOString()
    });

    // ---- Audit log ---------------------------------------------------------
    await createAuditEvent(supabase, {
      actorUserId: data.userId,
      actorRole: "service",
      targetType: "payment_attempt",
      targetId: attemptId ?? orderCode ?? "unknown",
      action: "webhook_processed",
      summary: `PayOS webhook for ${orderCode ?? "?"} -> ${attemptStatus}`,
      payload: { orderCode, status: attemptStatus, tier, amountVnd: attemptPayload.amount_vnd }
    });

    return jsonSuccess({ received: true, verified: true });
  } catch (error) {
    return handleApiError(error, "Unable to process billing webhook.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
