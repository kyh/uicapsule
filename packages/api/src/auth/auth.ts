import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { sendPasswordResetEmail } from "./password-reset-email";

const resolveBaseUrl = () => {
  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const baseUrl = resolveBaseUrl();

export const auth = betterAuth({
  baseURL: baseUrl,
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword:
      process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM
        ? ({ user, url }) => sendPasswordResetEmail(user.email, url)
        : undefined,
  },
  // Share counters across serverless instances. Credential routes use better-auth's stricter limit.
  rateLimit: {
    enabled: true,
    max: 10,
    storage: "database",
    window: 60,
  },
  trustedOrigins: [baseUrl],
});
