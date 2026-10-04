import "server-only";
import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import type { BaseURLConfig } from "better-auth";
// relations-v2, not better-auth's default re-export: the default entry reads `db._.fullSchema`, gone in drizzle 1.0; relations-v2 reads `db._.relations`.
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";

import { sendPasswordResetEmail } from "./password-reset-email";

// The first host doubles as the fallback, so a request on an unlisted alias still resolves.
const vercelBaseUrl = (...hosts: (string | undefined)[]): BaseURLConfig => {
  const allowedHosts = hosts.filter((host): host is string => Boolean(host));
  return { allowedHosts, fallback: `https://${allowedHosts[0]}`, protocol: "https" };
};

// Each allowed host is also trusted as an origin. Preview deploys answer on both the
// per-deployment URL and the branch alias; pinning one of them 403s sign-in on the other.
export const resolveBaseUrl = (): BaseURLConfig => {
  if (process.env.VERCEL_ENV === "production") {
    return vercelBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }
  if (process.env.VERCEL_ENV === "preview") {
    return vercelBaseUrl(process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL);
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const auth = betterAuth({
  baseURL: resolveBaseUrl(),
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
});
