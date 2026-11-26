import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consola } from "consola";

import { ignoredDirectories, validateContentDirectory } from "./content-validation";

const contentRoot = fileURLToPath(new URL("../content", import.meta.url));

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

  const sourced = await Promise.all(candidates.map(async (slug) => await hasSource(slug)));
  const slugs = candidates.filter((_, index) => sourced[index] === true);

  const results = await Promise.all(
    slugs.map(async (slug) => ({
      issues: await validateContentDirectory(path.join(contentRoot, slug)),
      slug,
    })),
  );

  let failures = 0;

  for (const { slug, issues } of results) {
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
