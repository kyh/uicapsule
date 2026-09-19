import type { Config } from "drizzle-kit";

export default {
  casing: "snake_case",
  dbCredentials: {
    authToken: process.env.TURSO_AUTH_TOKEN,
    url: process.env.TURSO_DATABASE_URL ?? "",
  },
  dialect: "turso",
  out: "./drizzle",
  schema: "./src/drizzle-schema-auth.ts",
} satisfies Config;
