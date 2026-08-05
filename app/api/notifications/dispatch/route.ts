import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { clampString } from "@/lib/api/validation";
import { dispatchNotificationBatch } from "@/services/notifications";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();
    const title = clampString(body.title, "title") || "Notification";
    const bodyText = clampString(body.body, "message") || "You have a new update.";
    const channel = body.channel === "email" || body.channel === "push" ? body.channel : "in_app";

    const result = await dispatchNotificationBatch({
      userId,
      title,
      body: bodyText,
      channel,
      payload: body.payload ?? {}
    });

    return jsonSuccess({ dispatch: result });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to dispatch notifications.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
