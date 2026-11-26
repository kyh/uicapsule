import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const designSystemTemplate = path.join(import.meta.dirname, "templates/design-system");
const TEMPLATE_ONLY = new Set(["README.md", "system.ts"]);
const SCOPE_CLASS = "ds-template";

export type ScaffoldKind = "component" | "design-system";

export interface ScaffoldOptions {
  slug: string;
  name: string;
  description: string;
  kind: ScaffoldKind;
}

const dependencies = (kind: ScaffoldKind) =>
  Object.fromEntries(
    ["lucide-react", "motion", "react", "react-dom"].flatMap((name) =>
      kind === "component" || name !== "motion" ? [[name, "catalog:"]] : [],
    ),
  );

const packageJson = (slug: string, kind: ScaffoldKind) =>
  `${JSON.stringify(
    {
      dependencies: dependencies(kind),
      devDependencies: {
        "@types/react": "catalog:",
        "@types/react-dom": "catalog:",
      },
      name: `@uicapsule/${slug}`,
      private: true,
      scripts: {
        clean: "git clean -xdf .cache .turbo dist node_modules",
      },
      type: "module",
      version: "0.1.0",
    },
    null,
    2,
  )}\n`;

interface ScaffoldMeta {
  addedAt: string;
  defaultSize?: "full";
  description: string;
  name: string;
  tags: string[];
}

const META_KEYS = [
  "name",
  "description",
  "addedAt",
  "defaultSize",
  "tags",
] satisfies (keyof ScaffoldMeta)[];

const metaJson = ({ name, description, kind }: ScaffoldOptions) => {
  const meta: ScaffoldMeta = {
    addedAt: new Date().toISOString().slice(0, 10),
    description,
    name,
    tags: [],
  };

  if (kind === "design-system") {
    meta.defaultSize = "full";
    meta.tags = ["design-systems"];
  }

  return `${JSON.stringify(meta, META_KEYS, 2)}\n`;
};

const componentFiles = (slug: string, name: string) => {
  const componentName = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return {
    [`${slug}.tsx`]: `"use client";

export const ${componentName} = () => {
  return <div>{${JSON.stringify(name)}}</div>;
};
`,
    "preview.tsx": `"use client";

import { ${componentName} } from "./${slug}";

const Preview = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <${componentName} />
    </div>
  );
};

export default Preview;
`,
  };
};

const scopeTemplate = async (directory: string, slug: string) => {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && /\.(?:tsx?|css)$/u.test(entry.name))
      .map(async (entry) => {
        const file = path.join(entry.parentPath, entry.name);
        const source = await readFile(file, "utf-8");
        await writeFile(file, source.replaceAll(SCOPE_CLASS, `ds-${slug}`));
      }),
  );
};

const designSystemFiles = (name: string, description: string) => ({
  "system.ts": `export const system = {
  name: ${JSON.stringify(name)},
  tagline: ${JSON.stringify(description)},
};
`,
});

export const writeScaffold = async (directory: string, options: ScaffoldOptions) => {
  const { slug, name, description, kind } = options;
  await mkdir(directory, { recursive: true });

  if (kind === "design-system") {
    await cp(designSystemTemplate, directory, {
      filter: (source) => !TEMPLATE_ONLY.has(path.relative(designSystemTemplate, source)),
      recursive: true,
    });
    await scopeTemplate(directory, slug);
  }

  const files = {
    "meta.json": metaJson(options),
    "package.json": packageJson(slug, kind),
    ...(kind === "design-system"
      ? designSystemFiles(name, description)
      : componentFiles(slug, name)),
  };

  await Promise.all(
    Object.entries(files).map(async ([file, source]) => {
      await writeFile(path.join(directory, file), source);
    }),
  );
};
