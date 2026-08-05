import { ForbiddenError } from "@/lib/api/route-errors";

const mockSupabaseClient = {
  from: () => ({
    update: () => ({ eq: jest.fn().mockResolvedValue({}), in: jest.fn().mockResolvedValue({}) }),
    select: () => ({
      eq: () => ({ single: jest.fn().mockReturnValue({ order: jest.fn().mockReturnValue({}) }) }),
      order: jest.fn().mockReturnValue({})
    }),
    insert: () => ({ select: () => ({ single: jest.fn().mockResolvedValue({ data: { id: "audit-1" }, error: null }) }) })
  })
};

function mockRequireAdmin(role: string) {
  return {
    supabase: mockSupabaseClient as any,
    userId: "actor-id",
    role
  };
}

jest.mock("@/lib/api/admin-guard", () => ({
  requireAdmin: jest.fn(),
  requireFullAdmin: jest.fn(),
  __esModule: true
}));

jest.mock("@/lib/payments/payment-audit", () => ({
  createAuditEvent: jest.fn().mockResolvedValue(true),
  __esModule: true
}));

import { PATCH } from "@/app/api/admin/users/[id]/route";
import { POST as bulkPOST } from "@/app/api/admin/bulk-actions/route";
import { requireAdmin, requireFullAdmin } from "@/lib/api/admin-guard";

describe("admin role authorization - single user", () => {
  const targetId = "user-abc-123";
  const url = `http://localhost/api/admin/users/${targetId}`;

  function patchRequest(body: unknown) {
    return PATCH(
      new Request(url, {
        method: "PATCH",
        headers: { authorization: "Bearer test-token", "content-type": "application/json" },
        body: JSON.stringify(body)
      }),
      { params: Promise.resolve({ id: targetId }) }
    );
  }

  beforeEach(() => jest.clearAllMocks());

  describe("support role", () => {
    beforeEach(() => {
      (requireAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("support"));
      (requireFullAdmin as jest.Mock).mockRejectedValue(new ForbiddenError("Only full admins can manage user roles."));
    });

    it("returns 403 when attempting role change", async () => {
      const res = await patchRequest({ role: "moderator" });
      expect(res.status).toBe(403);
      expect(requireFullAdmin).toHaveBeenCalled();
    });

    it("allows goal-only update", async () => {
      const res = await patchRequest({ goal: "cut" });
      expect(res.status).toBe(200);
      expect(requireAdmin).toHaveBeenCalled();
      expect(requireFullAdmin).not.toHaveBeenCalled();
    });
  });

  describe("moderator role", () => {
    beforeEach(() => {
      (requireAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("moderator"));
      (requireFullAdmin as jest.Mock).mockRejectedValue(new ForbiddenError("Only full admins can manage user roles."));
    });

    it("returns 403 when attempting role change", async () => {
      const res = await patchRequest({ role: "admin" });
      expect(res.status).toBe(403);
      expect(requireFullAdmin).toHaveBeenCalled();
    });

    it("allows goal-only update", async () => {
      const res = await patchRequest({ goal: "bulk" });
      expect(res.status).toBe(200);
      expect(requireAdmin).toHaveBeenCalled();
      expect(requireFullAdmin).not.toHaveBeenCalled();
    });
  });

  describe("admin role", () => {
    beforeEach(() => {
      (requireAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("admin"));
      (requireFullAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("admin"));
    });

    it("allows role change", async () => {
      const res = await patchRequest({ role: "moderator" });
      expect(res.status).toBe(200);
      expect(requireFullAdmin).toHaveBeenCalled();
    });

    it("allows goal change", async () => {
      const res = await patchRequest({ goal: "maintain" });
      expect(res.status).toBe(200);
      expect(requireAdmin).toHaveBeenCalled();
      expect(requireFullAdmin).not.toHaveBeenCalled();
    });

    it("allows simultaneous role and goal change", async () => {
      const res = await patchRequest({ role: "support", goal: "cut" });
      expect(res.status).toBe(200);
      expect(requireFullAdmin).toHaveBeenCalled();
    });
  });

  describe("invalid input", () => {
    beforeEach(() => {
      (requireAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("admin"));
      (requireFullAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("admin"));
    });

    it("rejects invalid role value", async () => {
      const res = await patchRequest({ role: "superadmin" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid goal value", async () => {
      const res = await patchRequest({ goal: "lean" });
      expect(res.status).toBe(400);
    });
  });
});

describe("admin role authorization - bulk actions", () => {
  const url = "http://localhost/api/admin/bulk-actions";

  function bulkRequest(body: unknown) {
    return bulkPOST(
      new Request(url, {
        method: "POST",
        headers: { authorization: "Bearer test-token", "content-type": "application/json" },
        body: JSON.stringify(body)
      })
    );
  }

  beforeEach(() => jest.clearAllMocks());

  describe("update_user_role", () => {
    it("rejects support from bulk role update", async () => {
      (requireFullAdmin as jest.Mock).mockRejectedValue(new ForbiddenError("Only full admins can manage user roles."));
      const res = await bulkRequest({ action: "update_user_role", role: "moderator", userIds: ["user-1"] });
      expect(res.status).toBe(403);
    });

    it("rejects moderator from bulk role update", async () => {
      (requireFullAdmin as jest.Mock).mockRejectedValue(new ForbiddenError("Only full admins can manage user roles."));
      const res = await bulkRequest({ action: "update_user_role", role: "admin", userIds: ["user-1"] });
      expect(res.status).toBe(403);
    });

    it("allows admin to bulk-update roles", async () => {
      (requireFullAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("admin"));
      const res = await bulkRequest({ action: "update_user_role", role: "support", userIds: ["user-1", "user-2"] });
      expect(res.status).toBe(200);
    });
  });

  describe("update_notification_state", () => {
    it("allows support to update notification state", async () => {
      (requireAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("support"));
      const res = await bulkRequest({ action: "update_notification_state", state: "read", notificationIds: ["notif-1"] });
      expect(res.status).toBe(200);
    });

    it("allows moderator to update notification state", async () => {
      (requireAdmin as jest.Mock).mockResolvedValue(mockRequireAdmin("moderator"));
      const res = await bulkRequest({ action: "update_notification_state", state: "dismissed", notificationIds: ["notif-1"] });
      expect(res.status).toBe(200);
    });
  });
});
