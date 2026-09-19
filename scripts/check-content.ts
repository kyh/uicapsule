import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consola } from "consola";

import { ignoredDirectories, validateContentDirectory } from "./content-validation";

const contentRoot = fileURLToPath(new URL("../content", import.meta.url));

// A deleted package leaves its node_modules behind on builders that restore
// the previous build's cache (Vercel); that ghost directory is not content.
const hasSource = async (slug: string) => {
  const names = await readdir(path.join(contentRoot, slug));
  return names.some((name) => !ignoredDirectories.has(name));
};

const main = async () => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();
  const slugs: string[] = [];
  for (const slug of candidates) {
    if (await hasSource(slug)) {
      slugs.push(slug);
    }
  }
  let failures = 0;
  for (const slug of slugs) {
    const issues = await validateContentDirectory(path.join(contentRoot, slug));
    for (const issue of issues) {
      consola.error(`content/${slug}: ${issue}`);
    }
    if (issues.length > 0) {
      failures += 1;
    }
  }
  if (failures > 0) {
    consola.error(`${failures} content packages failed validation.`);
    process.exitCode = 1;
    return;
  }
  consola.success(`Validated ${slugs.length} standalone content packages.`);
};

try {
  await main();
} catch (error) {
  consola.error(error);
  process.exitCode = 1;
}
