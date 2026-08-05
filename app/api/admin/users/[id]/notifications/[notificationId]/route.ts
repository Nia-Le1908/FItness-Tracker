import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";

// Next.js 15 breaking change: `params` is now a Promise that must be awaited
// before accessing its fields. Previously (Next 14 and below) it was a
// plain object `{ id: string; notificationId: string }`.
type PatchParams = {
  id: string;
  notificationId: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<PatchParams> }
) {
  try {
    const { supabase } = await requireAdmin(request);
    const body = await request.json();
    const state = body.state === "read" || body.state === "dismissed" || body.state === "queued" || body.state === "sent" || body.state === "failed" ? body.state : "read";

    const { id, notificationId } = await params;

    await supabase.from("notification_events").update({ state }).eq("id", notificationId).eq("user_id", id);
    return jsonSuccess({ updated: true, state });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to update notification.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
