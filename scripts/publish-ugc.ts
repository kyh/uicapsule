#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractClient } from "@repo/contract";
import { UGC_SHARED_MODULES, newUgcBuild, ugcSlugSchema } from "@repo/contract/ugc/ugc-schema";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import * as esbuild from "esbuild";

import { ASSET_LOADERS, compilePreviewStylesheet } from "./preview-bundle";

const bundle = async (dir: string, assetBase: string) => {
  const outdir = path.join(dir, ".ugc-out");

  const result = await esbuild.build({
    absWorkingDir: dir,
    assetNames: "assets/[name]-[hash]",
    bundle: true,
    chunkNames: "chunks/[name]-[hash]",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    entryPoints: { index: path.join(dir, "preview.tsx") },
    external: [...UGC_SHARED_MODULES],
    format: "esm",
    jsx: "automatic",
    legalComments: "none",
    loader: ASSET_LOADERS,
    logLevel: "warning",
    minify: true,
    outdir,
    publicPath: assetBase,
    splitting: true,
    target: "es2022",
    write: false,
  });

  const files = new Map(
    result.outputFiles.map((file) => [path.relative(outdir, file.path), file.contents]),
  );

  const bundled = new TextDecoder().decode(files.get("index.css") ?? new Uint8Array());
  const tailwind = await compilePreviewStylesheet(dir, true);
  files.set("index.css", new TextEncoder().encode(`${tailwind}\n${bundled}`));

  return files;
};

const main = defineCommand({
  args: {
    "asset-base": {
      description: "With --out: the public URL assets are referenced from",
      type: "string",
    },
    dir: {
      description: "Component directory holding preview.tsx",
      required: true,
      type: "positional",
    },
    name: { description: "Display name of the component", type: "string" },
    out: {
      description: "Only build: write the files under this directory instead of publishing",
      type: "string",
    },
    slug: { description: "Slug under /u/<username>/", required: true, type: "string" },
    url: {
      default: process.env.UICAPSULE_URL ?? "http://localhost:3000",
      description: "The uicapsule site to publish to",
      type: "string",
    },
    username: {
      description: "Set your username first (needed once, before your first publish)",
      type: "string",
    },
  },
  meta: {
    description:
      "Build one component's preview and publish it to your account, at /u/<username>/<slug>. Needs UICAPSULE_TOKEN, a session token from signing in.",
    name: "publish:ugc",
  },
  run: async ({ args }) => {
    const dir = path.resolve(args.dir);
    const slug = ugcSlugSchema.parse(args.slug);

    if (!existsSync(path.join(dir, "preview.tsx"))) {
      throw new Error(`${dir} has no preview.tsx`);
    }

    if (args.out) {
      const build = newUgcBuild();
      const files = await bundle(dir, args["asset-base"] ?? `https://assets.invalid/ugc/${build}`);
      const out = path.join(path.resolve(args.out), build);

      for (const [file, contents] of files) {
        await mkdir(path.dirname(path.join(out, file)), { recursive: true });
        await writeFile(path.join(out, file), contents);
      }

      consola.success(`Built ${files.size} files into ${out}`);

      return;
    }

    const token = process.env.UICAPSULE_TOKEN;

    if (!token) {
      throw new Error("UICAPSULE_TOKEN is unset: sign in and pass your session token");
    }

    if (!args.name) {
      throw new Error("--name is required to publish");
    }

    const headers = { authorization: `Bearer ${token}` };

    if (args.username) {
      const response = await fetch(new URL("/api/auth/update-user", args.url), {
        body: JSON.stringify({ username: args.username }),
        headers: { ...headers, "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Could not set username: ${await response.text()}`);
      }
    }

    const client: ContractClient = createORPCClient(
      new RPCLink({ headers, origin: new URL(args.url).origin, url: "/api/orpc" }),
    );

    const { assetBase, build } = await client.ugc.prepare({ slug });
    const files = await bundle(dir, assetBase);

    const { uploads } = await client.ugc.createUpload({
      build,
      files: [...files].map(([file, contents]) => ({ path: file, size: contents.byteLength })),
      slug,
    });

    for (const upload of uploads) {
      const response = await fetch(upload.url, {
        body: files.get(upload.path) ?? new Uint8Array(),
        headers: { "content-type": upload.contentType },
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error(`Uploading ${upload.path} failed: ${await response.text()}`);
      }
    }

    const published = await client.ugc.publish({ build, name: args.name, slug });

    consola.success(
      `Published ${published.path} (build ${build}, ${uploads.length} of ${files.size} files uploaded). Live at ${new URL(`/preview-frame${published.path}`, args.url).href} within a minute.`,
    );
  },
});

await runMain(main);
