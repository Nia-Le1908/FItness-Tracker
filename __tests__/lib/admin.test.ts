import { isAdminRole, canAccessAdmin, canManageUserRoles, getRoleLabel } from "@/lib/admin";

describe("isAdminRole", () => {
  it("returns true for 'admin'", () => {
    expect(isAdminRole("admin")).toBe(true);
  });

  it("returns false for other roles", () => {
    expect(isAdminRole("moderator")).toBe(false);
    expect(isAdminRole("support")).toBe(false);
    expect(isAdminRole("user")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("canAccessAdmin", () => {
  it("returns true for admin roles", () => {
    expect(canAccessAdmin("admin")).toBe(true);
    expect(canAccessAdmin("moderator")).toBe(true);
    expect(canAccessAdmin("support")).toBe(true);
  });

  it("returns false for non-admin roles", () => {
    expect(canAccessAdmin("user")).toBe(false);
    expect(canAccessAdmin("")).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});

describe("canManageUserRoles", () => {
  it("returns true only for 'admin'", () => {
    expect(canManageUserRoles("admin")).toBe(true);
  });

  it("returns false for staff roles", () => {
    expect(canManageUserRoles("moderator")).toBe(false);
    expect(canManageUserRoles("support")).toBe(false);
  });

  it("returns false for non-staff and falsy values", () => {
    expect(canManageUserRoles("user")).toBe(false);
    expect(canManageUserRoles("")).toBe(false);
    expect(canManageUserRoles(null)).toBe(false);
    expect(canManageUserRoles(undefined)).toBe(false);
  });
});

describe("getRoleLabel", () => {
  it("returns proper labels for known roles", () => {
    expect(getRoleLabel("admin")).toBe("Admin");
    expect(getRoleLabel("moderator")).toBe("Moderator");
    expect(getRoleLabel("support")).toBe("Support");
  });

  it("returns 'User' for unknown roles", () => {
    expect(getRoleLabel("user")).toBe("User");
    expect(getRoleLabel("")).toBe("User");
    expect(getRoleLabel(null)).toBe("User");
    expect(getRoleLabel(undefined)).toBe("User");
  });
});
