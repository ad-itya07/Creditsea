import type { Role } from "@/types";

export const dashboardRoles: Role[] = [
  "ADMIN",
  "SALES",
  "SANCTION",
  "DISBURSEMENT",
  "COLLECTION",
];

export function isDashboardRole(role: Role) {
  return dashboardRoles.includes(role);
}

export function canUseModule(role: Role, module: Exclude<Role, "BORROWER">) {
  return role === "ADMIN" || role === module;
}
