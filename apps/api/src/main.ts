import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // Behind Render's proxy — needed for secure cookies + rate limiting.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.use(helmet());
  app.use(cookieParser());

  const origins = (config.get<string>("CORS_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  // Everything lives under /api/v1 (matches the original API shape).
  app.setGlobalPrefix("api/v1");

  // Global validation: strip unknown fields (blocks mass assignment),
  // reject requests that send them, and transform payloads to DTO types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const port = config.get<number>("PORT") ?? 3000;
  await app.listen(port, "0.0.0.0");
  Logger.log(`🚀 API running on http://localhost:${port}/api/v1`, "Bootstrap");
}

bootstrap();
