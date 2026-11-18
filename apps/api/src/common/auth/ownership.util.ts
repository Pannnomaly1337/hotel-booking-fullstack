import { ForbiddenException } from "@nestjs/common";
import { Role } from "@repo/types";
import { AuthUser } from "../decorators/current-user.decorator";

export function assertCanAccess(
  resourceOwnerId: string,
  user: AuthUser,
  allowedStaffRoles: Role[] = [],
): void {
  const isOwner = resourceOwnerId === user.id;
  const isAllowedStaff = allowedStaffRoles.includes(user.role);

  if (!isOwner && !isAllowedStaff) {
    throw new ForbiddenException("You do not have access to this resource");
  }
}
