import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDatabasePath = resolve(__dirname, "sqlite.db");
const sqlite = new Database(process.env.DATABASE_URL ?? defaultDatabasePath);

export const db = drizzle({
  client: sqlite,
  schema: { ...schema, ...schemaAuth },
});

export type Db = typeof db;
