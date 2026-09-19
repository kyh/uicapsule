#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";

const repoRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.join(repoRoot, "content");

const SLUG_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

const packageJson = (slug: string) =>
  `${JSON.stringify(
    {
      dependencies: {
        react: "catalog:",
        "react-dom": "catalog:",
      },
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

const previewTsx = (slug: string, componentName: string) => `"use client";

import { ${componentName} } from "./${slug}";

const Preview = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <${componentName} />
    </div>
  );
};

export default Preview;
`;

const componentTsx = (componentName: string, displayName: string) => `"use client";

export const ${componentName} = () => {
  return <div>{${JSON.stringify(displayName)}}</div>;
};
`;

const main = defineCommand({
  args: {
    description: {
      description: "Short description for meta.json.",
      type: "string",
    },
    install: {
      default: true,
      description: "Run pnpm install to link the workspace package (--no-install to skip).",
      type: "boolean",
    },
    name: {
      description: "Display name shown in the UI. Defaults to the title-cased slug.",
      type: "string",
    },
    slug: {
      description: 'Lowercase, hyphenated slug — used as the directory name (e.g. "my-component").',
      required: true,
      type: "positional",
    },
  },
  meta: {
    description: "Scaffold a new blank content component.",
    name: "new:content",
  },
  run: async ({ args }) => {
    const slug = args.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      consola.error(`Invalid slug "${args.slug}". Use kebab-case, e.g. "my-component".`);
      process.exit(1);
    }

    const dir = path.join(contentRoot, slug);
    if (existsSync(dir)) {
      consola.error(`content/${slug} already exists.`);
      process.exit(1);
    }

    const words = slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1));
    const displayName = args.name ?? words.join(" ");
    const componentName = words.join("");

    consola.start(`Scaffolding content/${slug}`);

    try {
      await mkdir(dir, { recursive: true });
      await Promise.all([
        writeFile(
          path.join(dir, "meta.json"),
          `${JSON.stringify(
            /* oxlint-disable sort-keys -- written to meta.json in this order, matching existing content */
            {
              name: displayName,
              description: args.description ?? "",
              addedAt: new Date().toISOString().slice(0, 10),
              tags: [],
            },
            /* oxlint-enable sort-keys */
            null,
            2,
          )}\n`,
        ),
        writeFile(path.join(dir, "package.json"), packageJson(slug)),
        writeFile(path.join(dir, "preview.tsx"), previewTsx(slug, componentName)),
        writeFile(path.join(dir, `${slug}.tsx`), componentTsx(componentName, displayName)),
      ]);
      consola.info(`Created content/${slug}`);

      if (args.install) {
        consola.info("Running pnpm install...");
        execSync("pnpm install", { cwd: repoRoot, stdio: "inherit" });
      } else {
        consola.info("Skipped pnpm install (--no-install)");
      }
    } catch (error) {
      await rm(dir, { force: true, recursive: true });
      consola.error(`Failed — rolled back content/${slug}.`);
      throw error;
    }

    consola.success(`Scaffolded content/${slug}`);
    consola.log("");
    consola.info("Next steps:");
    consola.log(`  1. Build your component in content/${slug}/${slug}.tsx`);
    consola.log(`  2. Stage it in content/${slug}/preview.tsx`);
    consola.log(`  3. Fill in description/tags (and optional cover) in content/${slug}/meta.json`);
    consola.log(`  4. View it at http://localhost:3000/ui/${slug} (pnpm dev:web)`);
  },
});

void runMain(main);
