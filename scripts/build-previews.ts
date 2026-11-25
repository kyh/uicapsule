#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, watch, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import * as esbuild from "esbuild";

import { contentMetaSchema } from "../apps/web/src/lib/content/content-schema";
import {
  ASSET_LOADERS,
  compilePreviewStylesheet,
  previewEntry,
  repoRoot,
  themeStylesheet,
  webRoot,
} from "./preview-bundle";

const contentRoot = path.join(repoRoot, "content");
const outRoot = path.join(webRoot, "public/previews");

const BUILD_ID_FILE = "build.txt";
const ENTRY_NAMESPACE = "preview-entry";

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
        const previewFile = path.join(contentRoot, args.path, "preview.tsx");

        return {
          contents: previewEntry(previewFile, dev ? `/previews/${BUILD_ID_FILE}` : undefined),
          loader: "ts",
          resolveDir: path.join(contentRoot, args.path),
        };
      });
    },
  }) satisfies esbuild.Plugin;

const buildStylesheets = async (slugs: string[], dev: boolean) => {
  await Promise.all(
    slugs.map(async (slug) => {
      const dir = path.join(outRoot, slug);
      const css = await compilePreviewStylesheet(path.join(contentRoot, slug), !dev);

      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "tailwind.css"), css);

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
