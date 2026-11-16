import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  // Used by Render's health check.
  @Public()
  @Get()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
