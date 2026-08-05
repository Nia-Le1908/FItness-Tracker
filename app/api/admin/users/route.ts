import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError, isForbiddenError } from "@/lib/api/route-errors";
import { apiDefaults } from "@/lib/constants";
import { requireAdmin } from "@/lib/api/admin-guard";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const role = url.searchParams.get("role")?.trim() ?? "";
    const goal = url.searchParams.get("goal")?.trim() ?? "";
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;

    if (url.searchParams.has("limit") && !Number.isInteger(limitParam)) {
      return handleApiError(new Error("Invalid limit."), "Invalid limit.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
    }

    let query = supabase
      .from("users")
      .select("id,full_name,email,role,height_cm,daily_budget_vnd,goal,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    if (role) {
      if (!isAllowedUserRole(role)) {
        return handleApiError(new Error("Invalid role filter."), "Invalid role filter.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
      }
      query = query.eq("role", role);
    }

    if (goal) {
      if (!isAllowedUserGoal(goal)) {
        return handleApiError(new Error("Invalid goal filter."), "Invalid goal filter.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
      }
      query = query.eq("goal", goal);
    }

    const { data } = await query;
    return jsonSuccess({ users: data ?? [] });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    if (isForbiddenError(error)) {
      return handleApiError(error, "Forbidden.", apiDefaults.forbiddenStatus, "FORBIDDEN");
    }
    return handleApiError(error, "Unable to load users.", apiDefaults.badRequestStatus, "VALIDATION_ERROR");
  }
}

function isAllowedUserRole(value: string) {
  return ["user", "support", "moderator", "admin"].includes(value);
}

function isAllowedUserGoal(value: string) {
  return ["cut", "maintain", "bulk"].includes(value);
}
