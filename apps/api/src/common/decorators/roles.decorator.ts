import { SetMetadata } from "@nestjs/common";
import { Role } from "@repo/types";

export const ROLES_KEY = "roles";

/** Restrict a route to the given role(s). Used together with RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
