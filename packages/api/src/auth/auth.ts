import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  baseURL: baseUrl,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [baseUrl],
  // Share counters across serverless instances. Credential routes use better-auth's stricter limit.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 10,
  },
});
