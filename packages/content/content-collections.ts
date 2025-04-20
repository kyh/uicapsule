import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import { defineCollection, defineConfig } from "@content-collections/core";

const componentsMeta = defineCollection({
  name: "componentsMeta",
  directory: "src",
  include: "**/*.yml",
  parser: "yaml",
  schema: (z) => ({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  transform: async (doc, { cache }) => {
    const filePath = doc._meta.filePath;
    const sourcePath = `src/${filePath.replace(".yml", ".tsx")}`;

    const sourceCode = await cache(sourcePath, async (sourcePath) => {
      const sourceCode = await fs.readFile(sourcePath, "utf-8");
      return sourceCode;
    });

    const lastModified = await cache(sourcePath, (sourcePath) => {
      const stdout = execSync(`git log -1 --format=%ai -- ${sourcePath}`);
      const output = stdout.toString().trim();
      if (output) {
        return new Date(output).toISOString();
      }
      return new Date().toISOString();
    });

    return {
      title: doc.title,
      description: doc.description,
      tags: doc.tags ?? [],
      slug: doc._meta.fileName.replace(".yml", ""),
      category: doc._meta.directory,
      sourceCode,
      lastModified,
    };
  },
});

export default defineConfig({
  collections: [componentsMeta],
});
