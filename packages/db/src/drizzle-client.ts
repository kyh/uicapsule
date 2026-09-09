import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";

import * as schema from "./drizzle-schema-auth";

const client = createClient({
  authToken: process.env.TURSO_AUTH_TOKEN,
  url: process.env.TURSO_DATABASE_URL ?? "",
});

export const db = drizzle({
  casing: "snake_case",
  client,
  schema,
});
