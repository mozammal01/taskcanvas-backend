import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
