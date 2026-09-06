import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { sendPasswordResetEmail } from "./password-reset-email";

export const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  baseURL: baseUrl,
  emailAndPassword: {
    enabled: true,
    sendResetPassword:
      process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM
        ? ({ user, url }) => sendPasswordResetEmail(user.email, url)
        : undefined,
    revokeSessionsOnPasswordReset: true,
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
