import "server-only";
import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import type { BaseURLConfig } from "better-auth";
// WARNING: keep the relations-v2 entry; the default adapter reads db._.fullSchema, which drizzle 1.0 removed.
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { emailOTP } from "better-auth/plugins";

import {
  SIGN_IN_CODE_OFF_WARNING,
  guardSignInCodes,
  signInCodeModeOf,
  signInCodeSenderOf,
} from "./sign-in-code-email";

const vercelBaseUrl = (...hosts: (string | undefined)[]) => {
  const allowedHosts = hosts.filter((host): host is string => Boolean(host));

  return {
    allowedHosts,
    fallback: `https://${allowedHosts[0]}`,
    protocol: "https",
  } satisfies BaseURLConfig;
};

export const resolveBaseUrl = () => {
  if (process.env.VERCEL_ENV === "production") {
    return vercelBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (process.env.VERCEL_ENV === "preview") {
    return vercelBaseUrl(process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL);
  }

  return process.env.BETTER_AUTH_URL === undefined || process.env.BETTER_AUTH_URL === ""
    ? "http://localhost:3000"
    : process.env.BETTER_AUTH_URL;
};

const signInCodeMode = signInCodeModeOf(
  { AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM, RESEND_API_KEY: process.env.RESEND_API_KEY },
  process.env.NODE_ENV === "production",
);

if (signInCodeMode === "off") {
  console.warn(`[sign-in-code] ${SIGN_IN_CODE_OFF_WARNING}`);
}

export const auth = betterAuth({
  baseURL: resolveBaseUrl(),
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  hooks: { before: guardSignInCodes(signInCodeMode) },
  plugins: [emailOTP({ sendVerificationOTP: signInCodeSenderOf(signInCodeMode) })],
  rateLimit: {
    enabled: true,
    max: 10,
    storage: "database",
    window: 60,
  },
});
