import fs from "node:fs/promises";
import path from "node:path";
import { defineCollection, defineConfig } from "@content-collections/core";
import toCamelCase from "camelcase";

import type { Schema } from "@content-collections/core";

const extension = ".md";

const componentsMeta = defineCollection({
  name: "componentsMeta",
  directory: "src",
  include: `**/*${extension}`,
  schema: (z) => ({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  onSuccess: async (docs) => {
    await generatePreview(docs);
    // await generateSourceCode(docs);
  },
});

type Doc = Schema<"frontmatter", any>;

const generatePreview = async (docs: Doc[]) => {
  const imports: string[] = [];
  const exports: string[] = [];

  for (const doc of docs) {
    const slug = getSlug(doc._meta.filePath);
    const componentName = toCamelCase(slug, { pascalCase: true });
    const previewPath = doc._meta.filePath
      .replace("meta", "preview")
      .replace(extension, "");

    imports.push(`import ${componentName} from "./${previewPath}";`);
    exports.push(`  "${slug}": ${componentName}`);
  }

  const content = `
${imports.join("\n")}

export default {
${exports.join(",\n")}
};
  `.trim();

  const outputFile = path.join(process.cwd(), "src", "preview.tsx");

  await fs.writeFile(outputFile, content);
};

const generateSourceCode = async (docs: Doc[]) => {
  const exports: string[] = [];

  for (const doc of docs) {
    const slug = getSlug(doc._meta.filePath);
    const sourcePath = `src/${doc._meta.filePath.replace("meta", "source").replace(extension, ".tsx")}`;

    const sourceCode = await fs.readFile(sourcePath, "utf-8");
    exports.push(`  "${slug}": \`${escape(sourceCode)}\``);
  }

  const content = `
export default {
${exports.join(",\n")}
};
  `.trim();

  const outputFile = path.join(process.cwd(), "src", "source.tsx");

  await fs.writeFile(outputFile, content);
};

const getSlug = (filePath: string): string => {
  return path.basename(path.dirname(filePath));
};

const escape = (str: string): string => {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
};

export default defineConfig({
  collections: [componentsMeta],
});
