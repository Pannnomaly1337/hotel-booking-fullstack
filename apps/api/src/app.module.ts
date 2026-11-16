import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Local dev: read the repo-root .env (cwd is apps/api under turbo).
      // On Render/Docker the env is injected directly, so a missing file is fine.
      envFilePath: ["apps/api/.env", ".env", "../../.env"],
    }),
    // Global rate limit: 100 requests / 15 min (matches the original).
    ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    BookingsModule,
    ContactsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: throttle → authenticate → authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
