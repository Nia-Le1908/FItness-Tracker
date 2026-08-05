export type AdminRole = "admin" | "moderator" | "support" | "user";

export function isAdminRole(role: string | null | undefined): role is "admin" {
  return role === "admin";
}

export function canAccessAdmin(role: string | null | undefined) {
  return role === "admin" || role === "moderator" || role === "support";
}

export function canManageUserRoles(role: string | null | undefined): role is "admin" {
  return role === "admin";
}

export function getRoleLabel(role: string | null | undefined) {
  if (role === "admin") return "Admin";
  if (role === "moderator") return "Moderator";
  if (role === "support") return "Support";
  return "User";
}
