import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const baseUrl =
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
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];

/**
 * Cached function to get the current user session
 * Uses React cache to avoid unnecessary re-fetching
 * @returns Promise<Session | null> - The current user session or null if not authenticated
 */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));
