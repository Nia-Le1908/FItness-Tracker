import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { createPayOSPayment } from "@/lib/payments/payos";
import { normalizePaymentGateway, type PaymentGateway } from "@/lib/billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPaymentAttempt } from "@/lib/payments/payment-audit";
import { assertRequestBody, isAllowedValue } from "@/lib/api/validation";

function buildCheckoutUrl(gateway: PaymentGateway, plan: string) {
  return `/billing?gateway=${gateway}&plan=${plan}`;
}

function parseCheckoutBody(body: unknown) {
  assertRequestBody(body);
  const plan = isAllowedValue(body.plan, ["premium", "annual"] as const) ? body.plan : null;
  const gateway = isAllowedValue(body.gateway, ["payos", "vnpay", "momo", "zalopay"] as const) ? normalizePaymentGateway(body.gateway) : null;
  // A01 fix: ignore client-supplied userId. The user id is ALWAYS resolved
  // from the bearer token to prevent IDOR (charging premium to another user).
  // We intentionally do not read body.userId.
  return { plan, gateway };
}

async function resolveUserId(request: Request) {
  // Always require the bearer token; client-supplied user ids are ignored.
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseCheckoutBody(body);
    if (!parsed.plan || !parsed.gateway) {
      return handleApiError(new Error("Invalid checkout request."), "Invalid checkout request.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
    }

    const userId = await resolveUserId(request);
    const plan = parsed.plan;
    const gateway = parsed.gateway;

    if (gateway === "payos") {
      if (!userId) {
        return handleApiError(new Error("Sign in to continue."), "Sign in to continue.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
      }

      const orderCode = Number(String(Date.now()).slice(-6));
      const amount = plan === "annual" ? 999000 : 99000;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const returnUrl = `${baseUrl}/billing/callback?provider=payos&plan=${plan}&status=success`;
      const cancelUrl = `${baseUrl}/billing/callback?provider=payos&plan=${plan}&status=cancel`;
      const hasPayOSEnv = Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
      // A02/A04 fix: mock mode must NEVER grant premium in production. Only
      // enable it in non-production environments (test/dev/preview).
      const isMockAllowed = process.env.NODE_ENV !== "production" && process.env.ENABLE_MOCK_PAYMENTS === "1";
      const supabase = createSupabaseServerClient();
      const attempt = createPaymentAttempt({
        userId,
        provider: "payos",
        plan,
        orderCode: String(orderCode),
        status: "created",
        amountVnd: amount,
        currency: "VND",
        rawRequest: { plan, gateway, userId, orderCode, amount, returnUrl, cancelUrl, mode: hasPayOSEnv ? "live" : "mock" }
      });

      await supabase.from("payment_attempts").upsert({
        user_id: attempt.userId,
        provider: attempt.provider,
        plan: attempt.plan,
        order_code: attempt.orderCode,
        payment_link_id: null,
        status: attempt.status,
        amount_vnd: attempt.amountVnd,
        currency: attempt.currency,
        checkout_url: null,
        raw_request: attempt.rawRequest,
        raw_response: null,
        created_at: attempt.createdAt,
        updated_at: attempt.updatedAt
      });

      if (!hasPayOSEnv) {
        if (!isMockAllowed) {
          // Production-capable fallback: refuse to mint premium when PayOS
          // env is missing in production. Surface a clear error instead of
          // silently granting entitlements.
          return handleApiError(
            new Error("PayOS not configured. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY."),
            "Billing is not available right now. Please try again later.",
            apiDefaults.badRequestStatus,
            "CONFIG_ERROR"
          );
        }

        const mockCheckoutUrl = `${baseUrl}/billing/callback?provider=payos&plan=${plan}&status=success&mode=mock&orderCode=${orderCode}`;

        await supabase.from("payment_attempts").upsert({
          user_id: attempt.userId,
          provider: attempt.provider,
          plan: attempt.plan,
          order_code: attempt.orderCode,
          payment_link_id: `mock-${orderCode}`,
          status: "pending",
          amount_vnd: attempt.amountVnd,
          currency: attempt.currency,
          checkout_url: mockCheckoutUrl,
          raw_request: attempt.rawRequest,
          raw_response: { mode: "mock", checkoutUrl: mockCheckoutUrl },
          created_at: attempt.createdAt,
          updated_at: new Date().toISOString()
        });

        return jsonSuccess({
          checkoutUrl: mockCheckoutUrl,
          provider: gateway,
          requestedPlan: plan,
          payment: { checkoutUrl: mockCheckoutUrl, paymentLinkId: `mock-${orderCode}` },
          returnUrl,
          cancelUrl,
          userId,
          orderCode,
          mock: true
        });
      }

      let payment;
      let buyerName: string | undefined;
      let buyerEmail: string | undefined;
      try {
        const { data: userProfile } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", userId)
          .single();
        if (userProfile) {
          buyerName = userProfile.full_name ?? undefined;
          buyerEmail = userProfile.email ?? undefined;
        }
      } catch {
      }

      try {
        payment = await createPayOSPayment({
          plan,
          orderCode,
          amount,
          description: `FitBudget ${plan} subscription`,
          returnUrl,
          cancelUrl,
          buyerName,
          buyerEmail,
          metadata: {
            user_id: userId,
            plan,
            gateway,
            orderCode
          }
        });
      } catch (payosError) {
        const message = payosError instanceof Error ? payosError.message : "Unable to create PayOS checkout session.";
        return handleApiError(new Error(message), message, apiDefaults.badRequestStatus, "CONFIG_ERROR");
      }

      await supabase.from("payment_attempts").upsert({
        user_id: attempt.userId,
        provider: attempt.provider,
        plan: attempt.plan,
        order_code: attempt.orderCode,
        payment_link_id: payment.paymentLinkId ?? null,
        status: "pending",
        amount_vnd: attempt.amountVnd,
        currency: attempt.currency,
        checkout_url: payment.checkoutUrl,
        raw_request: attempt.rawRequest,
        raw_response: payment,
        created_at: attempt.createdAt,
        updated_at: new Date().toISOString()
      });

      return jsonSuccess({
        checkoutUrl: payment.checkoutUrl,
        provider: gateway,
        requestedPlan: plan,
        payment,
        returnUrl,
        cancelUrl,
        userId,
        orderCode,
        mock: false
      });
    }

    return jsonSuccess({
      checkoutUrl: buildCheckoutUrl(gateway, plan),
      provider: gateway,
      requestedPlan: plan,
      userId
    });
  } catch (error) {
    return handleApiError(error, error instanceof Error ? error.message : "Unable to create checkout session.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
  }
}
