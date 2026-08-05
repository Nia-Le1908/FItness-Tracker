import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return jsonSuccess({ attempts: [], timeline: [] });
    }

    const supabase = createSupabaseRouteClient(token);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      return jsonSuccess({ attempts: [], timeline: [] });
    }

    const { data: attempts } = await supabase
      .from("payment_attempts")
      .select("id,user_id,provider,plan,order_code,payment_link_id,status,amount_vnd,currency,checkout_url,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const timeline = (attempts ?? []).map((attempt) => ({
      title: `${attempt.provider.toUpperCase()} · ${attempt.plan}`,
      description: `Order #${attempt.order_code} · ${attempt.status}`,
      status: attempt.status,
      createdAt: attempt.created_at
    }));

    return jsonSuccess({ attempts: attempts ?? [], timeline });
  } catch (error) {
    return handleApiError(error, "Unable to load billing history.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
