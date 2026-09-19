import { spawn } from "node:child_process";
import { once } from "node:events";
import { glob, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consola } from "consola";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const contentRoot = path.join(repoRoot, "content");
const compiler = path.join(repoRoot, "node_modules/typescript/bin/tsc");

const main = async () => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();
  const requested = process.argv.slice(2);
  const unknownSlugs = requested.filter((slug) => !slugs.includes(slug));
  if (unknownSlugs.length > 0) {
    throw new Error(`Unknown content: ${unknownSlugs.join(", ")}`);
  }
  const selected = requested.length > 0 ? [...new Set(requested)] : slugs;
  const configRoot = await mkdtemp(path.join(tmpdir(), "uicapsule-typecheck-"));
  let checked = 0;
  const failed: string[] = [];

  try {
    for (const slug of selected) {
      const packageRoot = path.join(contentRoot, slug);
      const files: string[] = [];
      for await (const file of glob("**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}", {
        cwd: packageRoot,
        exclude: ["**/node_modules/**", "**/dist/**", "**/.cache/**", "**/.turbo/**"],
      })) {
        files.push(path.join(packageRoot, file));
      }
      if (files.length === 0) {
        continue;
      }

      const previewCheck = path.join(configRoot, `${slug}-preview.ts`);
      await writeFile(
        previewCheck,
        `import type { ComponentType } from ${JSON.stringify(path.join(packageRoot, "node_modules/@types/react/index"))};\n` +
          `import Preview from ${JSON.stringify(path.join(packageRoot, "preview"))};\n` +
          "Preview satisfies ComponentType;\n",
      );
      files.push(previewCheck);

      const config = path.join(configRoot, `${slug}.json`);
      await writeFile(
        config,
        JSON.stringify({ extends: path.join(repoRoot, "tsconfig.content.json"), files }),
      );
      const child = spawn(process.execPath, [compiler, "--noEmit", "--project", config], {
        cwd: repoRoot,
        stdio: "inherit",
      });
      const [exitCode] = await once(child, "close");
      checked += 1;
      if (exitCode !== 0) {
        failed.push(slug);
      }
    }
  } finally {
    await rm(configRoot, { force: true, recursive: true });
  }

  if (failed.length > 0) {
    consola.error(`Content typecheck failed: ${failed.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  consola.success(`Typechecked ${checked} content packages independently.`);
};

try {
  await main();
} catch (error) {
  consola.error(error);
  process.exitCode = 1;
}
