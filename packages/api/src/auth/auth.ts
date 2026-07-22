import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

// Origins allowed to drive authenticated requests. Only the web app runs
// same-origin as baseUrl. Consumed by better-auth's own Origin checks and by
// the tRPC mutation guard (see packages/api/src/trpc.ts).
export const trustedOrigins = [baseUrl];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  baseURL: baseUrl,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
  // Persist rate-limit counters in the database. The default in-memory store
  // keeps per-instance counters, so on serverless (Vercel) the effective limit
  // multiplies across cold-started instances and resets on every deploy.
  //
  // This 10/60s is the fallback for auth routes generally — it does NOT govern
  // the credential endpoints. better-auth applies a built-in rule of 3
  // requests/10s to /sign-in*, /sign-up*, /change-password* and /change-email*,
  // which overrides these values (only rateLimit.customRules could raise them).
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 10,
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
