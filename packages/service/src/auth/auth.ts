import "server-only";
import { db } from "@repo/db/drizzle-client";
import { handleSchema } from "@repo/contract/ugc/ugc-schema";
import { betterAuth } from "better-auth";
import type { BaseURLConfig } from "better-auth";
// WARNING: keep the relations-v2 entry; the default adapter reads db._.fullSchema, which drizzle 1.0 removed.
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { bearer, jwt, username } from "better-auth/plugins";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";

import {
  PASSWORD_RESET_OFF_WARNING,
  passwordResetModeOf,
  passwordResetSenderOf,
} from "./password-reset-email";

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

/**
 * The one origin OAuth tokens and signed upload URLs are minted for. Unlike `resolveBaseUrl`, a
 * preview deployment has to pick one of its hosts: the branch URL, which survives redeploys.
 */
export const canonicalOrigin = () => {
  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL}`;
  }

  return process.env.BETTER_AUTH_URL === undefined || process.env.BETTER_AUTH_URL === ""
    ? "http://localhost:3000"
    : process.env.BETTER_AUTH_URL;
};

/** The issuer of every JWT, pinned so a token minted through any of a deployment's hosts verifies. */
export const AUTH_ISSUER = `${canonicalOrigin()}/api/auth`;

/** The publishing MCP server: the protected resource every MCP access token is bound to. */
export const MCP_PUBLISH_RESOURCE = `${canonicalOrigin()}/mcp/publish`;

const passwordResetMode = passwordResetModeOf(
  { AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM, RESEND_API_KEY: process.env.RESEND_API_KEY },
  process.env.NODE_ENV === "production",
);

if (passwordResetMode === "off") {
  console.warn(`[password-reset] ${PASSWORD_RESET_OFF_WARNING}`);
}

export const auth = betterAuth({
  baseURL: resolveBaseUrl(),
  disabledPaths: ["/token"],
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: passwordResetSenderOf(passwordResetMode),
  },
  plugins: [
    bearer(),
    jwt({ disableSettingJwtHeader: true, jwt: { issuer: AUTH_ISSUER } }),
    mcp({
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
      consentPage: "/auth/consent",
      loginPage: "/auth/login",
      resource: MCP_PUBLISH_RESOURCE,
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
    username({
      displayUsername: false,
      maxUsernameLength: 39,
      minUsernameLength: 3,
      usernameValidator: (value) => handleSchema.safeParse(value).success,
    }),
  ],
  rateLimit: {
    enabled: true,
    max: 10,
    storage: "database",
    window: 60,
  },
});
