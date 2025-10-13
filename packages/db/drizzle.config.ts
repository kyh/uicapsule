import { resolve } from "node:path";
import type { Config } from "drizzle-kit";

const defaultDatabaseFile = resolve(process.cwd(), "src", "sqlite.db");
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseFile;

export default {
  dialect: "sqlite",
  schema: ["./src/drizzle-schema-auth.ts", "./src/drizzle-schema.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
