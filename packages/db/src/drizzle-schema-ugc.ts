import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./drizzle-schema-auth";

/** A component a user published: its slug on their account and the build it currently serves. */
export const ugcComponent = sqliteTable(
  "ugc_component",
  {
    build: text("build").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("ugc_component_user_slug_idx").on(table.userId, table.slug),
    index("ugc_component_updated_idx").on(table.updatedAt),
  ],
);
