import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { DEFAULT_ENTITLEMENT, normalizeEntitlement } from "@/lib/billing";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return jsonSuccess(DEFAULT_ENTITLEMENT);
    }

    const supabase = createSupabaseRouteClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return jsonSuccess(DEFAULT_ENTITLEMENT);
    }

    const { data, error } = await supabase
      .from("billing_entitlements")
      .select("tier,status,source,current_period_end,product_id,customer_id,updated_at")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      return jsonSuccess(DEFAULT_ENTITLEMENT);
    }

    return jsonSuccess(normalizeEntitlement(data ?? DEFAULT_ENTITLEMENT));
  } catch (error) {
    return handleApiError(error, "Unable to load entitlement.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
