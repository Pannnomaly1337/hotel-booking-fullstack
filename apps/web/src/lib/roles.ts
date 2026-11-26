import type { Role } from "@repo/types";

export const STAFF_ROLES: Role[] = [
  "frontdesk",
  "housekeeping",
  "manager",
  "admin",
];

export function isStaff(role?: Role | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function homeForRole(role?: Role | null): string {
  return isStaff(role) ? "/staff" : "/";
}
