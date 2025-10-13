import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDatabasePath = resolve(__dirname, "sqlite.db");

export const db = drizzle(
  process.env.DATABASE_URL ?? `file:${defaultDatabasePath}`,
  {
    schema: { ...schema, ...schemaAuth },
  },
);

export type Db = typeof db;
