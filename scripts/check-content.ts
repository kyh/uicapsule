#!/usr/bin/env tsx
/**
 * Fails the build if any `content/<slug>/` directory is not a loadable
 * component. This mirrors the acceptance rule in
 * `apps/web/src/lib/content/content-fs.ts` (`buildComponent`), which otherwise
 * SILENTLY drops an invalid directory by returning null — so a half-scaffolded
 * or abandoned stub disappears from the gallery with no error, and accumulates
 * unnoticed. This guard turns that silence into a failed build.
 *
 * A directory is valid when it has a `meta.json` AND either:
 *   - `meta.type === "remote"` with both `iframeUrl` and `sourceUrl`, or
 *   - (the default, local) a root `preview.tsx`.
 */
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const contentRoot = join(repoRoot, "content");

type RawMeta = {
  type?: "local" | "remote";
  iframeUrl?: string;
  sourceUrl?: string;
};

const readJson = async (path: string): Promise<RawMeta | null> => {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as RawMeta;
  } catch {
    return null;
  }
};

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
};

/** Returns the reason a directory is invalid, or null when it is valid. */
const validate = async (slug: string): Promise<string | null> => {
  const dir = join(contentRoot, slug);
  const meta = await readJson(join(dir, "meta.json"));
  if (!meta) return "missing or unparseable meta.json";

  if (meta.type === "remote") {
    if (!meta.iframeUrl || !meta.sourceUrl) {
      return 'type "remote" requires both iframeUrl and sourceUrl in meta.json';
    }
    return null;
  }

  if (!(await fileExists(join(dir, "preview.tsx")))) {
    return "missing preview.tsx (a local component must export a default preview)";
  }
  return null;
};

const main = async (): Promise<void> => {
  const entries = await readdir(contentRoot, { withFileTypes: true }).catch(() => []);
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const failures: { slug: string; reason: string }[] = [];
  for (const slug of slugs) {
    const reason = await validate(slug);
    if (reason) failures.push({ slug, reason });
  }

  if (failures.length > 0) {
    consola.error(
      `Found ${failures.length} invalid content director${failures.length === 1 ? "y" : "ies"}:`,
    );
    for (const { slug, reason } of failures) {
      consola.error(`  content/${slug} — ${reason}`);
    }
    consola.info(
      "The gallery loader drops these silently. Finish the component (meta.json + preview.tsx), " +
        "or delete the directory. To scaffold one: pnpm new:content <slug>.",
    );
    process.exit(1);
  }

  consola.success(`Checked ${slugs.length} content components — all valid.`);
};

main().catch((error) => {
  consola.error(error);
  process.exit(1);
});
