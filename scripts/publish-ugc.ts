#!/usr/bin/env tsx
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import * as esbuild from "esbuild";

import {
  parseUgcSlug,
  ugcBuildKey,
  ugcManifestKey,
  ugcManifestSchema,
} from "../apps/web/src/lib/content/ugc-preview";
import { blobToken } from "./blob-token";
import {
  ASSET_LOADERS,
  SHARED_PACKAGES,
  compilePreviewStylesheet,
  previewEntry,
  repoRoot,
  webRoot,
} from "./preview-bundle";

const ENTRY = "ugc-entry";

const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json"],
]);

const sharedAliases = Object.fromEntries(
  SHARED_PACKAGES.map((name) => [name, path.join(webRoot, "node_modules", name)]),
);

const bundle = async (dir: string, publicPath: string) => {
  const result = await esbuild.build({
    absWorkingDir: dir,
    alias: sharedAliases,
    assetNames: "assets/[name]-[hash]",
    bundle: true,
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    entryPoints: { index: ENTRY },
    format: "esm",
    jsx: "automatic",
    legalComments: "none",
    loader: ASSET_LOADERS,
    logLevel: "warning",
    minify: true,
    outdir: path.join(dir, ".ugc-out"),
    plugins: [
      {
        name: ENTRY,
        setup: (build) => {
          // oxlint-disable-next-line require-unicode-regexp -- esbuild filters are Go regexps, which reject the u flag
          build.onResolve({ filter: /^ugc-entry$/ }, () => ({ namespace: ENTRY, path: ENTRY }));
          // oxlint-disable-next-line require-unicode-regexp -- esbuild filters are Go regexps, which reject the u flag
          build.onLoad({ filter: /.*/, namespace: ENTRY }, () => ({
            contents: previewEntry(path.join(dir, "preview.tsx")),
            loader: "ts",
            resolveDir: dir,
          }));
        },
      },
    ],
    publicPath,
    target: "es2022",
    write: false,
  });

  const files = new Map(
    result.outputFiles.map((file) => [
      path.relative(path.join(dir, ".ugc-out"), file.path),
      file.contents,
    ]),
  );

  files.set("tailwind.css", new TextEncoder().encode(await compilePreviewStylesheet(dir, true)));

  if (!files.has("index.css")) {
    files.set("index.css", new Uint8Array());
  }

  return files;
};

const main = defineCommand({
  args: {
    dir: {
      description: "Component directory holding preview.tsx",
      required: true,
      type: "positional",
    },
    name: {
      description: "Display name shown in the preview's title",
      required: true,
      type: "string",
    },
    out: {
      description: "Write the Blob keys under this local directory instead of uploading",
      type: "string",
    },
    slug: { description: "Slug to publish under (ugc/<slug>/…)", required: true, type: "string" },
  },
  meta: {
    description:
      "Build one component's preview and publish it to the assets Blob store, where /preview-frame/<slug> finds it when the slug is not in content/. Trusted input only: this does not sandbox the build.",
    name: "publish:ugc",
  },
  run: async ({ args }) => {
    const dir = path.resolve(args.dir);
    const slug = parseUgcSlug(args.slug);
    const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL;

    if (!slug) {
      throw new Error(`"${args.slug}" is not a valid slug: lowercase letters, digits and dashes`);
    }

    if (existsSync(path.join(repoRoot, "content", slug))) {
      throw new Error(`content/${slug} exists; the repo copy always wins, so pick another slug`);
    }

    if (!existsSync(path.join(dir, "preview.tsx"))) {
      throw new Error(`${dir} has no preview.tsx`);
    }

    if (!assetsUrl) {
      throw new Error("NEXT_PUBLIC_ASSETS_URL is unset; it is the Blob store the site reads from");
    }

    const build = randomBytes(8).toString("hex");
    const prefix = ugcBuildKey(slug, build);
    const files = await bundle(dir, `${assetsUrl}/${prefix}`);
    const manifest = ugcManifestSchema.parse({ build, name: args.name, version: 1 });
    const manifestKey = ugcManifestKey(slug);
    const manifestBody = new TextEncoder().encode(JSON.stringify(manifest));
    const objects = new Map([...files].map(([file, contents]) => [`${prefix}/${file}`, contents]));

    if (args.out) {
      const out = path.resolve(args.out);

      for (const [key, contents] of [...objects, [manifestKey, manifestBody] as const]) {
        await mkdir(path.dirname(path.join(out, key)), { recursive: true });
        await writeFile(path.join(out, key), contents);
      }

      consola.success(`Wrote ${objects.size} files for ${slug} (build ${build}) under ${out}`);

      return;
    }

    const token = await blobToken(repoRoot);

    for (const [key, contents] of objects) {
      await put(key, Buffer.from(contents), {
        access: "public",
        addRandomSuffix: false,
        contentType: CONTENT_TYPES.get(path.extname(key)),
        token,
      });
    }

    await put(manifestKey, Buffer.from(manifestBody), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
      token,
    });

    consola.success(
      `Published ${slug} (build ${build}); live at /preview-frame/${slug} within minutes`,
    );
  },
});

await runMain(main);
