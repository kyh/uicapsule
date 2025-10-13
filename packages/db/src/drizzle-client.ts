import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "",
  authToken: process.env.TURSO_AUTH_TOKEN ?? "",
});

export const db = drizzle({
  client,
  schema: { ...schema, ...schemaAuth },
});

export type Db = typeof db;
