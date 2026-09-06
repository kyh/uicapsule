import { spawn } from "node:child_process";
import { glob, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const contentRoot = join(repoRoot, "content");
const compiler = join(repoRoot, "node_modules/typescript/bin/tsc");

const main = async () => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();
  const requested = process.argv.slice(2);
  const unknownSlugs = requested.filter((slug) => !slugs.includes(slug));
  if (unknownSlugs.length > 0) throw new Error(`Unknown content: ${unknownSlugs.join(", ")}`);
  const selected = requested.length > 0 ? [...new Set(requested)] : slugs;
  const configRoot = await mkdtemp(join(tmpdir(), "uicapsule-typecheck-"));
  let checked = 0;
  const failed: string[] = [];

  try {
    for (const slug of selected) {
      const packageRoot = join(contentRoot, slug);
      const files: string[] = [];
      for await (const file of glob("**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}", {
        cwd: packageRoot,
        exclude: ["**/node_modules/**", "**/dist/**", "**/.cache/**", "**/.turbo/**"],
      })) {
        files.push(join(packageRoot, file));
      }
      if (files.length === 0) continue;

      const previewCheck = join(configRoot, `${slug}-preview.ts`);
      await writeFile(
        previewCheck,
        `import type { ComponentType } from ${JSON.stringify(join(packageRoot, "node_modules/@types/react/index"))};\n` +
          `import Preview from ${JSON.stringify(join(packageRoot, "preview"))};\n` +
          "Preview satisfies ComponentType;\n",
      );
      files.push(previewCheck);

      const config = join(configRoot, `${slug}.json`);
      await writeFile(
        config,
        JSON.stringify({ extends: join(repoRoot, "tsconfig.content.json"), files }),
      );
      const passed = await new Promise<boolean>((resolve, reject) => {
        const child = spawn(process.execPath, [compiler, "--noEmit", "--project", config], {
          cwd: repoRoot,
          stdio: "inherit",
        });
        child.once("error", reject);
        child.once("close", (code) => resolve(code === 0));
      });
      checked += 1;
      if (!passed) failed.push(slug);
    }
  } finally {
    await rm(configRoot, { recursive: true, force: true });
  }

  if (failed.length > 0) {
    consola.error(`Content typecheck failed: ${failed.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  consola.success(`Typechecked ${checked} content packages independently.`);
};

main().catch((error) => {
  consola.error(error);
  process.exitCode = 1;
});
