import { z } from "zod";

/**
 * Validate environment at startup. If a required secret is missing or weak,
 * the app refuses to boot instead of running insecurely.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  // access token (อายุสั้น) — ใช้ secret เดิม
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — generate a long random value"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  // refresh token (อายุยาว) — secret แยกคนละตัวกับ access (ถ้า access secret รั่ว refresh ยังปลอดภัย)
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters — generate a long random value"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  CORS_ORIGINS: z.string().default("http://localhost:3001"),
  COOKIE_DOMAIN: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
