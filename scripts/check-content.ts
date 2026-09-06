#!/usr/bin/env tsx
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";

import { contentMetaSchema } from "../apps/web/src/lib/content/content-schema";

const contentRoot = fileURLToPath(new URL("../content", import.meta.url));

const validate = async (slug: string): Promise<string | null> => {
  const dir = join(contentRoot, slug);
  const meta = await readFile(join(dir, "meta.json"), "utf-8")
    .then((source) => contentMetaSchema.safeParse(JSON.parse(source)))
    .catch(() => null);

  if (!meta) return "missing or unparseable meta.json";
  if (!meta.success) {
    return meta.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  }
  if (meta.data.type === "remote") return null;

  const preview = await stat(join(dir, "preview.tsx")).catch(() => null);
  return preview?.isFile() ? null : "missing preview.tsx";
};

const main = async () => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();

  const failures: { slug: string; reason: string }[] = [];
  for (const slug of slugs) {
    const reason = await validate(slug);
    if (reason) failures.push({ slug, reason });
  }

  if (failures.length > 0) {
    consola.error(`Found ${failures.length} invalid content directories:`);
    for (const { slug, reason } of failures) {
      consola.error(`  content/${slug} — ${reason}`);
    }
    consola.info(
      "Finish each component or delete its directory. Scaffold with pnpm new:content <slug>.",
    );
    process.exitCode = 1;
    return;
  }

  consola.success(`Checked ${slugs.length} content components — all valid.`);
};

main().catch((error) => {
  consola.error(error);
  process.exitCode = 1;
});
