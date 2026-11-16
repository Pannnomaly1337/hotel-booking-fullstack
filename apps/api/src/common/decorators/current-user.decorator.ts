import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Role } from "@repo/types";

export interface AuthUser {
  id: string;
  role: Role;
}

/** Inject the authenticated user (from the JWT) into a controller handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
