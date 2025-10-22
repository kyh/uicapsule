/**
 * Application schema
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contentComponent = sqliteTable("content_component", {
  slug: text("slug").primaryKey().notNull().unique(),
  type: text("type"), // "local" | "remote"
  name: text("name").notNull(),
  description: text("description"),
  defaultSize: text("default_size"),
  coverUrl: text("cover_url"),
  coverType: text("cover_type"), // "image" | "video"
  category: text("category"), // See content-categories.ts
  tags: text("tags"), // JSON array
  authors: text("authors"), // JSON array
  asSeenOn: text("as_seen_on"), // JSON array
  dependencies: text("dependencies"), // JSON object
  devDependencies: text("dev_dependencies"), // JSON object
  // Local content
  previewCode: text("preview_code"),
  sourceCode: text("source_code"), // JSON object
  // Remote content
  iframeUrl: text("iframe_url"),
  sourceUrl: text("source_url"),
  previousSlug: text("previous_slug"),
  nextSlug: text("next_slug"),
});
