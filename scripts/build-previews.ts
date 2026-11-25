#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, watch, writeFile } from "node:fs/promises";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import * as esbuild from "esbuild";
import postcss from "postcss";

import { contentMetaSchema } from "../apps/web/src/lib/content/content-schema";
import { PREVIEW_SHELL_CLASSES } from "../apps/web/src/lib/content/preview-shell";

const repoRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.join(repoRoot, "content");
const outRoot = path.join(repoRoot, "apps/web/public/previews");
const runtimeModule = path.join(repoRoot, "apps/web/src/lib/content/preview-runtime.ts");
const themeStylesheet = path.join(repoRoot, "packages/ui/src/styles/theme.css");

const BUILD_ID_FILE = "build.txt";
const SHELL_CLASSES = Object.values(PREVIEW_SHELL_CLASSES).join(" ");
const ENTRY_NAMESPACE = "preview-entry";

const ASSET_LOADERS = Object.fromEntries(
  [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "avif",
    "svg",
    "mp4",
    "webm",
    "mp3",
    "wav",
    "woff",
    "woff2",
    "ttf",
    "otf",
    "glb",
    "gltf",
    "hdr",
  ].map((extension) => [`.${extension}`, "file" as const]),
);

const isLocalPreview = async (slug: string) => {
  const meta = await readFile(path.join(contentRoot, slug, "meta.json"), "utf-8")
    .then((source) => contentMetaSchema.safeParse(JSON.parse(source)))
    .catch(() => null);

  if (!meta?.success || meta.data.type !== "local") {
    return false;
  }

  const preview = await stat(path.join(contentRoot, slug, "preview.tsx")).catch(() => null);

  return Boolean(preview?.isFile());
};

const readLocalSlugs = async () => {
  const entries = await readdir(contentRoot, { withFileTypes: true });

  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();

  const local = await Promise.all(slugs.map(isLocalPreview));

  return slugs.filter((_, index) => local[index]);
};

const entryPlugin = (dev: boolean) =>
  ({
    name: ENTRY_NAMESPACE,
    setup: (build) => {
      // oxlint-disable-next-line require-unicode-regexp -- esbuild filters are Go regexps, which reject the u flag
      build.onResolve({ filter: /^preview-entry:/ }, (args) => ({
        namespace: ENTRY_NAMESPACE,
        path: args.path.slice(ENTRY_NAMESPACE.length + 1),
      }));
      // oxlint-disable-next-line require-unicode-regexp -- esbuild filters are Go regexps, which reject the u flag
      build.onLoad({ filter: /.*/, namespace: ENTRY_NAMESPACE }, (args) => {
        const options = dev ? `, { buildUrl: "/previews/${BUILD_ID_FILE}" }` : "";

        return {
          contents: [
            `import Preview from ${JSON.stringify(path.join(contentRoot, args.path, "preview.tsx"))};`,
            `import { startPreview } from ${JSON.stringify(runtimeModule)};`,
            `startPreview(Preview${options});`,
          ].join("\n"),
          loader: "ts",
          resolveDir: path.join(contentRoot, args.path),
        };
      });
    },
  }) satisfies esbuild.Plugin;

const buildStylesheets = async (slugs: string[], dev: boolean) => {
  await Promise.all(
    slugs.map(async (slug) => {
      const base = path.join(contentRoot, slug);
      const dir = path.join(outRoot, slug);

      const result = await postcss([tailwindcss({ base, optimize: !dev })]).process(
        `@import ${JSON.stringify(themeStylesheet)};\n@source inline(${JSON.stringify(SHELL_CLASSES)});\n`,
        { from: path.join(base, "preview.tailwind.css") },
      );

      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "tailwind.css"), result.css);

      if (!existsSync(path.join(dir, "index.css"))) {
        await writeFile(path.join(dir, "index.css"), "");
      }
    }),
  );
};

const finishBuild = async (slugs: string[], dev: boolean) => {
  await buildStylesheets(slugs, dev);
  await writeFile(path.join(outRoot, BUILD_ID_FILE), String(Date.now()));
};

const buildOptions = (slugs: string[], dev: boolean) =>
  ({
    assetNames: "assets/[name]-[hash]",
    bundle: true,
    chunkNames: "chunks/[name]-[hash]",
    define: { "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production") },
    entryPoints: Object.fromEntries(
      slugs.map((slug) => [`${slug}/index`, `${ENTRY_NAMESPACE}:${slug}`]),
    ),
    format: "esm",
    jsx: "automatic",
    legalComments: "none",
    loader: ASSET_LOADERS,
    logLevel: "warning",
    minify: !dev,
    outdir: outRoot,
    plugins: [entryPlugin(dev)],
    publicPath: "/previews",
    sourcemap: dev ? "linked" : false,
    splitting: true,
    target: "es2022",
  }) satisfies esbuild.BuildOptions;

const main = defineCommand({
  args: {
    watch: {
      default: false,
      description: "Rebuild on change; previews served by `next dev` reload themselves.",
      type: "boolean",
    },
  },
  meta: {
    description:
      "Bundle every local content preview (esbuild + its own Tailwind stylesheet) into apps/web/public/previews.",
    name: "build:previews",
  },
  run: async ({ args }) => {
    const dev = args.watch;
    const started = performance.now();
    const slugs = await readLocalSlugs();

    if (!dev) {
      await rm(outRoot, { force: true, recursive: true });
      await esbuild.build(buildOptions(slugs, dev));
      await finishBuild(slugs, dev);
      consola.success(
        `Built ${slugs.length} previews in ${Math.round(performance.now() - started)}ms`,
      );

      return;
    }

    const context = await esbuild.context({
      ...buildOptions(slugs, dev),
      plugins: [
        entryPlugin(dev),
        {
          name: "preview-stylesheets",
          setup: (build) => {
            build.onEnd(async (result) => {
              if (result.errors.length === 0) {
                await finishBuild(slugs, dev);
                consola.info(`Rebuilt ${slugs.length} previews`);
              }
            });
          },
        },
      ],
    });

    await context.watch();

    consola.info(`Watching ${slugs.length} previews (restart to pick up a new content folder)`);

    for await (const change of watch(path.dirname(themeStylesheet))) {
      if (change.filename !== path.basename(themeStylesheet)) {
        continue;
      }

      await finishBuild(slugs, dev)
        .then(() => consola.info(`Restyled ${slugs.length} previews`))
        .catch((error: Error) => consola.error(error));
    }
  },
});

await runMain(main);
