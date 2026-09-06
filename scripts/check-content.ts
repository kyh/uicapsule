import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";

import { validateContentDirectory } from "./content-validation";

const contentRoot = fileURLToPath(new URL("../content", import.meta.url));

const main = async () => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();
  let failures = 0;
  for (const slug of slugs) {
    const issues = await validateContentDirectory(join(contentRoot, slug));
    for (const issue of issues) consola.error(`content/${slug}: ${issue}`);
    if (issues.length > 0) failures += 1;
  }
  if (failures > 0) {
    consola.error(`${failures} content packages failed validation.`);
    process.exitCode = 1;
    return;
  }
  consola.success(`Validated ${slugs.length} standalone content packages.`);
};

main().catch((error) => {
  consola.error(error);
  process.exitCode = 1;
});
