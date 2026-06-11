#!/usr/bin/env tsx
/**
 * Scaffolds a new content component:
 *   1. Creates content/<slug>/ with meta.json, package.json, preview.tsx, <slug>.tsx
 *   2. Adds @uicapsule/<slug> to apps/web/package.json dependencies
 *   3. Runs pnpm install to link the workspace package
 *
 * Everything else (the content index, next.config.js transpilePackages, the
 * shadcn registry) discovers components from the content/ directory at runtime.
 *
 * Usage:
 *   pnpm new:content <slug> [--name "Display Name"] [--description "..."] [--no-install]
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const contentRoot = join(repoRoot, "content");
const webPackageJsonPath = join(repoRoot, "apps", "web", "package.json");

const usage = () => {
  console.log(
    'Usage: pnpm new:content <slug> [--name "Display Name"] [--description "..."] [--no-install]',
  );
  process.exit(1);
};

const parseArgs = (argv: string[]) => {
  let slug: string | undefined;
  let name: string | undefined;
  let description: string | undefined;
  let install = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--name") name = argv[++i];
    else if (arg === "--description") description = argv[++i];
    else if (arg === "--no-install") install = false;
    else if (arg === "--help" || arg === "-h") usage();
    else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      usage();
    } else if (slug) {
      console.error(`Unexpected argument: ${arg}`);
      usage();
    } else slug = arg;
  }

  if (!slug) usage();
  return { slug: slug!, name, description, install };
};

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
      exports: {
        "./preview": "./preview.tsx",
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
  return <div>${displayName}</div>;
};
`;

/**
 * Inserts the dependency in alphabetical position without re-sorting existing
 * keys, so unrelated lines never change.
 */
const addWebDependency = async (slug: string) => {
  const pkgName = `@uicapsule/${slug}`;
  const raw = await readFile(webPackageJsonPath, "utf-8");
  const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
  const dependencies = pkg.dependencies ?? {};

  if (dependencies[pkgName]) {
    console.log(`- ${pkgName} already in apps/web/package.json, skipping`);
    return;
  }

  const next: Record<string, string> = {};
  let inserted = false;
  for (const [key, value] of Object.entries(dependencies)) {
    if (!inserted && pkgName.localeCompare(key) < 0) {
      next[pkgName] = "workspace:*";
      inserted = true;
    }
    next[key] = value;
  }
  if (!inserted) next[pkgName] = "workspace:*";

  pkg.dependencies = next;
  await writeFile(webPackageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`- Added ${pkgName} to apps/web/package.json`);
};

const main = async () => {
  const { slug, name, description, install } = parseArgs(process.argv.slice(2));

  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
    console.error(`Invalid slug "${slug}". Use kebab-case, e.g. "my-component".`);
    process.exit(1);
  }

  const dir = join(contentRoot, slug);
  if (existsSync(dir)) {
    console.error(`content/${slug} already exists.`);
    process.exit(1);
  }

  const displayName = name ?? toTitleCase(slug);
  const componentName = toPascalCase(slug);

  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(join(dir, "meta.json"), metaJson(displayName, description ?? "")),
    writeFile(join(dir, "package.json"), packageJson(slug)),
    writeFile(join(dir, "preview.tsx"), previewTsx(slug, componentName)),
    writeFile(join(dir, `${slug}.tsx`), componentTsx(componentName, displayName)),
  ]);
  console.log(`- Created content/${slug}`);

  await addWebDependency(slug);

  if (install) {
    console.log("- Running pnpm install...");
    execSync("pnpm install", { cwd: repoRoot, stdio: "inherit" });
  } else {
    console.log("- Skipped pnpm install (--no-install)");
  }

  console.log(`
Done! Next steps:
  1. Build your component in content/${slug}/${slug}.tsx
  2. Stage it in content/${slug}/preview.tsx
  3. Fill in description/tags (and optional coverUrl) in content/${slug}/meta.json
  4. View it at http://localhost:3000/ui/${slug} (pnpm dev:web)
`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
