import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAuditEvent } from "@/lib/payments/payment-audit";
import { assertRequestBody, isAllowedValue } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return handleApiError(new Error("Sign in to continue."), "Sign in to continue.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    const body = await request.json();
    assertRequestBody(body);
    const provider = isAllowedValue(body.provider, ["payos", "vnpay", "momo", "zalopay", "stripe"] as const) ? body.provider : "payos";
    const plan = isAllowedValue(body.plan, ["free", "premium", "annual"] as const) ? body.plan : null;
    if (!plan) {
      return handleApiError(new Error("Invalid cancellation request."), "Invalid cancellation request.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData.user?.id;

    if (!userId) {
      return handleApiError(new Error("Sign in to continue."), "Sign in to continue.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    await supabase.from("billing_entitlements").upsert({
      user_id: userId,
      tier: "free",
      status: "canceled",
      source: provider,
      updated_at: new Date().toISOString()
    });

    await supabase.from("payment_attempts").insert({
      user_id: userId,
      provider,
      plan,
      order_code: `cancel-${Date.now()}`,
      payment_link_id: null,
      status: "canceled",
      amount_vnd: 0,
      currency: "VND",
      checkout_url: null,
      raw_request: { action: "cancel", provider, plan },
      raw_response: { action: "cancel", provider, plan }
    });

    await createAuditEvent(supabase, {
      actorUserId: userId,
      targetType: "billing_entitlement",
      targetId: userId,
      action: "subscription_canceled",
      summary: `User canceled ${plan} subscription via ${provider}`,
      payload: { provider, plan }
    });

    return jsonSuccess({ canceled: true, provider, plan });
  } catch (error) {
    return handleApiError(error, "Unable to cancel subscription.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
