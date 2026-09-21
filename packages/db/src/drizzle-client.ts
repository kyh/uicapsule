import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";

import { relations } from "./drizzle-relations";

const client = createClient({
  authToken: process.env.TURSO_AUTH_TOKEN,
  url: process.env.TURSO_DATABASE_URL ?? "",
});

// The relation graph (not `schema`) is what powers `db.query` and lets the better-auth
// adapter resolve its tables from `db._.relations`.
export const db = drizzle({ client, relations });
