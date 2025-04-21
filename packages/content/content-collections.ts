import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { defineCollection, defineConfig } from "@content-collections/core";
import toCamelCase from "camelcase";

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
    const sourceCode = await fs.readFile(sourcePath, "utf-8");

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
      meta: doc._meta,
    };
  },
  onSuccess: async (docs) => {
    const imports: string[] = [];
    const exports: string[] = [];

    for (const doc of docs) {
      const componentName = toCamelCase(doc.slug, { pascalCase: true });
      imports.push(`import ${componentName} from "./${doc.meta.path}";`);
      exports.push(`  "${doc.slug}": ${componentName}`);
    }

    const content = `
${imports.join("\n")}
  
export default {
${exports.join(",\n")}
};
    `.trim();

    const outputFile = path.join(process.cwd(), "src", "index.tsx");

    await fs.writeFile(outputFile, content);
  },
});

export default defineConfig({
  collections: [componentsMeta],
});
