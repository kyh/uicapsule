import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";

import { relations } from "./drizzle-relations";

const client = createClient({
  authToken: process.env.TURSO_AUTH_TOKEN,
  url: process.env.TURSO_DATABASE_URL ?? "",
});

export const db = drizzle({ client, relations });
