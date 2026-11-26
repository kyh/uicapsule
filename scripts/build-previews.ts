#!/usr/bin/env tsx
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { build, createServer } from "vite";
import type { InlineConfig, Plugin, Rollup } from "vite";

import { contentMetaSchema } from "../apps/web/src/lib/content/content-schema";
import { PREVIEW_DEV_ORIGIN } from "../apps/web/src/lib/content/preview-shell";
import {
  EXTRA_ASSET_GLOBS,
  compilePreviewStylesheet,
  previewEntry,
  repoRoot,
  runtimeModule,
  themeStylesheet,
  webRoot,
} from "./preview-bundle";

const contentRoot = path.join(repoRoot, "content");
const outRoot = path.join(webRoot, "public/previews");

const ENTRY_PREFIX = "preview-entry:";
const RESOLVED_ENTRY_PREFIX = `\0${ENTRY_PREFIX}`;
const DEV_ENTRY = /^\/@preview\/(?<slug>[\w-]+)\.js$/u;
const STYLESHEET_NAME = "__preview__.tailwind.css";

const isLocalPreview = async (slug: string) => {
  const meta = await readFile(path.join(contentRoot, slug, "meta.json"), "utf-8")
    .then((source) => contentMetaSchema.safeParse(JSON.parse(source)))
    .catch(() => null);

  if (meta?.success !== true || meta.data.type !== "local") {
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

  return slugs.filter((_, index) => local[index] === true);
};

const stylesheetId = (slug: string) => path.join(contentRoot, slug, STYLESHEET_NAME);

const slugOfFile = (file: string) => {
  const relative = path.relative(contentRoot, file);

  return relative.startsWith("..") ? undefined : relative.split(path.sep)[0];
};

const previewPlugin = (slugs: string[], dev: boolean) => {
  const known = new Set(slugs);

  return {
    enforce: "pre",
    handleHotUpdate: ({ file, modules, server }) => {
      const touched = file === themeStylesheet ? slugs : [slugOfFile(file)];

      const stylesheets = touched
        .filter((slug): slug is string => slug !== undefined && known.has(slug))
        .map((slug) => server.moduleGraph.getModuleById(stylesheetId(slug)))
        .filter((module) => module !== undefined);

      for (const module of stylesheets) {
        server.moduleGraph.invalidateModule(module);
      }

      return [...modules, ...stylesheets];
    },
    load: async function load(id) {
      if (id.startsWith(RESOLVED_ENTRY_PREFIX)) {
        const slug = id.slice(RESOLVED_ENTRY_PREFIX.length);

        return previewEntry(path.join(contentRoot, slug, "preview.tsx"), stylesheetId(slug));
      }

      if (path.basename(id) === STYLESHEET_NAME) {
        this.addWatchFile(themeStylesheet);

        return await compilePreviewStylesheet(path.dirname(id), !dev);
      }

      return null;
    },
    name: "uicapsule-previews",
    resolveId: (source) => {
      const slug = source.startsWith(ENTRY_PREFIX)
        ? source.slice(ENTRY_PREFIX.length)
        : DEV_ENTRY.exec(source)?.groups?.slug;

      if (slug !== undefined && known.has(slug)) {
        return `${RESOLVED_ENTRY_PREFIX}${slug}`;
      }

      return path.basename(source) === STYLESHEET_NAME ? source : null;
    },
  } satisfies Plugin;
};

const cssOf = (chunk: Rollup.OutputChunk, files: Map<string, Rollup.OutputChunk>) => {
  const seen = new Set<string>();
  const css: string[] = [];

  const visit = (current: Rollup.OutputChunk) => {
    if (seen.has(current.fileName)) {
      return;
    }

    seen.add(current.fileName);

    for (const imported of current.imports) {
      const dependency = files.get(imported);

      if (dependency) {
        visit(dependency);
      }
    }

    css.push(...(current.viteMetadata?.importedCss ?? []));
  };

  visit(chunk);

  return [...new Set(css)];
};

const stylesheetPerPreview = {
  enforce: "post",
  generateBundle: function generateBundle(_, bundle) {
    const chunks = Object.values(bundle).filter((file) => file.type === "chunk");
    const files = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
    const merged = new Set<string>();

    for (const entry of chunks.filter((chunk) => chunk.isEntry)) {
      const css = cssOf(entry, files);

      const source = css
        .map((file) => bundle[file])
        .map((asset) => (asset?.type === "asset" ? String(asset.source) : ""))
        .join("\n");

      this.emitFile({
        fileName: path.posix.join(path.posix.dirname(entry.fileName), "index.css"),
        source,
        type: "asset",
      });

      for (const file of css) {
        merged.add(file);
      }
    }

    for (const file of merged) {
      Reflect.deleteProperty(bundle, file);
    }
  },
  name: "uicapsule-preview-stylesheets",
} satisfies Plugin;

const sharedConfig = (slugs: string[], dev: boolean) =>
  ({
    appType: "custom",
    assetsInclude: EXTRA_ASSET_GLOBS,
    configFile: false,
    logLevel: "warn",
    plugins: [previewPlugin(slugs, dev), react()],
    publicDir: false,
    root: contentRoot,
  }) satisfies InlineConfig;

const buildPreviews = async (slugs: string[]) => {
  await build({
    ...sharedConfig(slugs, false),
    base: "/previews/",
    build: {
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 4096,
      emptyOutDir: true,
      modulePreload: false,
      outDir: outRoot,
      reportCompressedSize: false,
      rolldownOptions: {
        input: Object.fromEntries(slugs.map((slug) => [`${slug}/index`, `${ENTRY_PREFIX}${slug}`])),
        onLog: (level, log, handler) => {
          if (log.code !== "INVALID_ANNOTATION") {
            handler(level, log);
          }
        },
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "chunks/[name]-[hash].js",
          entryFileNames: "[name].js",
        },
      },
      target: "es2022",
    },
    plugins: [...sharedConfig(slugs, false).plugins, stylesheetPerPreview],
  });
};

const previewLibRoot = path.dirname(path.dirname(runtimeModule));

const isAppFile = (file: string) =>
  file.startsWith(`${webRoot}${path.sep}`) &&
  !file.startsWith(`${previewLibRoot}${path.sep}`) &&
  !`${previewLibRoot}${path.sep}`.startsWith(`${file}${path.sep}`);

const servePreviews = async (slugs: string[]) => {
  const { port } = new URL(PREVIEW_DEV_ORIGIN);

  const server = await createServer({
    ...sharedConfig(slugs, true),
    optimizeDeps: {
      entries: [...slugs.map((slug) => path.join(contentRoot, slug, "preview.tsx")), runtimeModule],
    },
    root: webRoot,
    server: {
      cors: true,
      fs: { allow: [repoRoot] },
      origin: PREVIEW_DEV_ORIGIN,
      port: Number(port),
      strictPort: true,
      watch: { ignored: [isAppFile] },
    },
  });

  server.watcher.add(themeStylesheet);
  await server.listen();

  return server;
};

const main = defineCommand({
  args: {
    dev: {
      default: false,
      description: `Serve previews with hot reload at ${PREVIEW_DEV_ORIGIN} instead of building them`,
      type: "boolean",
    },
  },
  meta: {
    description:
      "Bundle every local content preview (Vite + its own Tailwind stylesheet) into apps/web/public/previews.",
    name: "build:previews",
  },
  run: async ({ args }) => {
    const started = performance.now();
    const slugs = await readLocalSlugs();

    if (args.dev) {
      await servePreviews(slugs);
      consola.info(
        `Serving ${slugs.length} previews at ${PREVIEW_DEV_ORIGIN} (restart to pick up a new content folder)`,
      );

      return;
    }

    await buildPreviews(slugs);
    consola.success(
      `Built ${slugs.length} previews in ${Math.round(performance.now() - started)}ms`,
    );
  },
});

await runMain(main);
