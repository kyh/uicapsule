/**
 * Application schema
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contentComponent = sqliteTable("content_component", {
  slug: text("slug").primaryKey().notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  defaultSize: text("default_size"),
  coverUrl: text("cover_url"),
  coverType: text("cover_type"),
  category: text("category"),
  tags: text("tags"), // JSON array
  authors: text("authors"), // JSON array
  asSeenOn: text("as_seen_on"), // JSON array
  previewCode: text("preview_code").notNull(),
  sourceCode: text("source_code").notNull(), // JSON object
  dependencies: text("dependencies"), // JSON object
  devDependencies: text("dev_dependencies"), // JSON object
  previousSlug: text("previous_slug"),
  nextSlug: text("next_slug"),
});
