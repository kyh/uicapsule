#!/usr/bin/env tsx
/**
 * Scaffolds a new content component:
 *   1. Creates content/<slug>/ with meta.json, package.json, preview.tsx, <slug>.tsx
 *   2. Runs pnpm install to link the workspace package
 *
 * Everything else (the content index, next.config.js transpilePackages, the
 * shadcn registry, the preview iframe) discovers components from the content/
 * directory at runtime — the web app never depends on content packages by name.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand, runMain } from "citty";
import consola from "consola";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const contentRoot = join(repoRoot, "content");

const SLUG_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const toPascalCase = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toTitleCase = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const metaJson = (name: string, description: string) =>
  JSON.stringify({ name, description, tags: [] }, null, 2) + "\n";

const packageJson = (slug: string) =>
  JSON.stringify(
    {
      name: `@uicapsule/${slug}`,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        clean: "git clean -xdf .cache .turbo dist node_modules",
      },
      dependencies: {
        react: "catalog:",
        "react-dom": "catalog:",
      },
      devDependencies: {
        "@types/react": "catalog:",
        "@types/react-dom": "catalog:",
      },
    },
    null,
    2,
  ) + "\n";

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
  meta: {
    name: "new:content",
    description: "Scaffold a new blank content component.",
  },
  args: {
    slug: {
      type: "positional",
      description: 'Lowercase, hyphenated slug — used as the directory name (e.g. "my-component").',
      required: true,
    },
    name: {
      type: "string",
      description: "Display name shown in the UI. Defaults to the title-cased slug.",
    },
    description: {
      type: "string",
      description: "Short description for meta.json.",
    },
    install: {
      type: "boolean",
      description: "Run pnpm install to link the workspace package (--no-install to skip).",
      default: true,
    },
  },
  run: async ({ args }) => {
    const slug = args.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      consola.error(`Invalid slug "${args.slug}". Use kebab-case, e.g. "my-component".`);
      process.exit(1);
    }

    const dir = join(contentRoot, slug);
    if (existsSync(dir)) {
      consola.error(`content/${slug} already exists.`);
      process.exit(1);
    }

    const displayName = args.name ?? toTitleCase(slug);
    const componentName = toPascalCase(slug);

    consola.start(`Scaffolding content/${slug}`);

    try {
      await mkdir(dir, { recursive: true });
      await Promise.all([
        writeFile(join(dir, "meta.json"), metaJson(displayName, args.description ?? "")),
        writeFile(join(dir, "package.json"), packageJson(slug)),
        writeFile(join(dir, "preview.tsx"), previewTsx(slug, componentName)),
        writeFile(join(dir, `${slug}.tsx`), componentTsx(componentName, displayName)),
      ]);
      consola.info(`Created content/${slug}`);

      if (args.install) {
        consola.info("Running pnpm install...");
        execSync("pnpm install", { cwd: repoRoot, stdio: "inherit" });
      } else {
        consola.info("Skipped pnpm install (--no-install)");
      }
    } catch (error) {
      // Roll back the partial scaffold so the command can simply be re-run
      await rm(dir, { recursive: true, force: true });
      consola.error(`Failed — rolled back content/${slug}.`);
      throw error;
    }

    consola.success(`Scaffolded content/${slug}`);
    consola.log("");
    consola.info("Next steps:");
    consola.log(`  1. Build your component in content/${slug}/${slug}.tsx`);
    consola.log(`  2. Stage it in content/${slug}/preview.tsx`);
    consola.log(
      `  3. Fill in description/tags (and optional coverUrl) in content/${slug}/meta.json`,
    );
    consola.log(`  4. View it at http://localhost:3000/ui/${slug} (pnpm dev:web)`);
  },
});

void runMain(main);
