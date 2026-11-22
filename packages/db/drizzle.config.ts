import type { Config } from "drizzle-kit";

export default {
  dbCredentials: {
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    url: process.env.TURSO_DATABASE_URL ?? "",
  },
  dialect: "turso",
  out: "./drizzle",
  schema: "./src/drizzle-schema-auth.ts",
} satisfies Config;
