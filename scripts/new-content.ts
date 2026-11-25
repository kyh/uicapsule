#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";

import { writeScaffold } from "./content-scaffold";

const repoRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.join(repoRoot, "content");

const SLUG_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

const main = defineCommand({
  args: {
    description: {
      description: "Short description for meta.json.",
      type: "string",
    },
    "design-system": {
      default: false,
      description:
        "Scaffold a design system from scripts/templates/design-system (starter showcase + component set).",
      type: "boolean",
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
    description: "Scaffold a new blank content component, or a design system from its template.",
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

    const displayName =
      args.name ??
      slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    const kind = args["design-system"] ? "design-system" : "component";

    consola.start(`Scaffolding ${kind} content/${slug}`);

    try {
      await writeScaffold(dir, {
        description: args.description ?? "",
        kind,
        name: displayName,
        slug,
      });
      execSync(`pnpm exec oxfmt content/${slug}`, { cwd: repoRoot, stdio: "ignore" });
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

    if (kind === "design-system") {
      consola.log(`  1. Define the system's tokens in content/${slug}/tokens.css`);
      consola.log(
        `  2. Reshape primitives in content/${slug}/components/ where tokens can't carry it`,
      );
      consola.log(`  3. Fill in description (and optional cover) in content/${slug}/meta.json`);
    } else {
      consola.log(`  1. Build your component in content/${slug}/${slug}.tsx`);
      consola.log(`  2. Stage it in content/${slug}/preview.tsx`);
      consola.log(
        `  3. Fill in description/tags (and optional cover) in content/${slug}/meta.json`,
      );
    }

    consola.log(`  4. View it at http://localhost:3000/ui/${slug} (pnpm dev:web)`);
  },
});

void runMain(main);
