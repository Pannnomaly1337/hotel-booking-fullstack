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
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — generate a long random value"),
  JWT_EXPIRES_IN: z.string().default("1h"),
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
