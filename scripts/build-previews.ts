#!/usr/bin/env tsx
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { UGC_SHARED_MODULES } from "@repo/contract/ugc/ugc-schema";
import react from "@vitejs/plugin-react";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { build, createServer } from "vite";
import type { InlineConfig, Plugin, Rollup } from "vite";

import { contentMetaSchema } from "../apps/web/src/lib/content/content-schema";
import {
  PREVIEW_DEV_ORIGIN,
  UGC_BASE_STYLESHEET_PATH,
  UGC_BOOT_PATH,
  ugcSharedModulePath,
} from "../apps/web/src/lib/content/preview-shell";
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

      if (slug && known.has(slug)) {
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

const IGNORED_WARNINGS = new Set(["INVALID_ANNOTATION", "MODULE_LEVEL_DIRECTIVE"]);

const quietWarnings = (warning: Rollup.RollupLog, warn: Rollup.LoggingFunction) => {
  if (!IGNORED_WARNINGS.has(warning.code ?? "")) {
    warn(warning);
  }
};

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
        onwarn: quietWarnings,
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

const SHARED_PREFIX = "ugc-shared:";
const RESOLVED_SHARED_PREFIX = `\0${SHARED_PREFIX}`;
const requireFromWeb = createRequire(path.join(webRoot, "package.json"));
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/u;

const sharedModuleSource = (specifier: string) => {
  const exported = requireFromWeb(specifier) as { __esModule?: boolean };

  if (exported.__esModule) {
    return `export * from ${JSON.stringify(specifier)};`;
  }

  const names = Object.keys(exported).filter((name) => name !== "default" && IDENTIFIER.test(name));

  return [
    `import shared from ${JSON.stringify(specifier)};`,
    "export default shared;",
    `export const { ${names.join(", ")} } = shared;`,
  ].join("\n");
};

const sharedModules = {
  load: (id) =>
    id.startsWith(RESOLVED_SHARED_PREFIX)
      ? sharedModuleSource(id.slice(RESOLVED_SHARED_PREFIX.length))
      : null,
  name: "uicapsule-ugc-shared",
  resolveId: (source) => (source.startsWith(SHARED_PREFIX) ? `\0${source}` : null),
} satisfies Plugin;

const outName = (publicPath: string) =>
  publicPath.replace(/^\/previews\//u, "").replace(/\.js$/u, "");

const buildUgcRuntime = async () => {
  await build({
    base: "/previews/",
    build: {
      chunkSizeWarningLimit: 4096,
      emptyOutDir: false,
      modulePreload: false,
      outDir: outRoot,
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          [outName(UGC_BOOT_PATH)]: path.join(webRoot, "src/lib/content/ugc-boot.ts"),
          ...Object.fromEntries(
            UGC_SHARED_MODULES.map((specifier) => [
              outName(ugcSharedModulePath(specifier)),
              `${SHARED_PREFIX}${specifier}`,
            ]),
          ),
        },
        onwarn: quietWarnings,
        output: {
          chunkFileNames: "_ugc/chunks/[name]-[hash].js",
          entryFileNames: "[name].js",
        },
        preserveEntrySignatures: "strict",
      },
      target: "es2022",
    },
    configFile: false,
    logLevel: "warn",
    plugins: [sharedModules],
    publicDir: false,
    root: webRoot,
  });

  const empty = await mkdtemp(path.join(tmpdir(), "ugc-base-"));
  const css = await compilePreviewStylesheet(empty, true);
  await writeFile(path.join(outRoot, UGC_BASE_STYLESHEET_PATH.replace(/^\/previews\//u, "")), css);
  await rm(empty, { force: true, recursive: true });
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
      await buildUgcRuntime();
      await servePreviews(slugs);
      consola.info(
        `Serving ${slugs.length} previews at ${PREVIEW_DEV_ORIGIN} (restart to pick up a new content folder)`,
      );

      return;
    }

    await buildPreviews(slugs);
    await buildUgcRuntime();
    consola.success(
      `Built ${slugs.length} previews in ${Math.round(performance.now() - started)}ms`,
    );
  },
});

await runMain(main);
