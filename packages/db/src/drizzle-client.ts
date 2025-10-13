import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

const sqlite = new Database(process.env.DATABASE_URL ?? "sqlite.db");

export const db = drizzle({
  client: sqlite,
  schema: { ...schema, ...schemaAuth },
});

export type Db = typeof db;
