import { writeFile } from "node:fs/promises";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const HTML_FILE = "gallery.html";

const htmlModule = () =>
  ({
    name: "uicapsule:html-module",
    writeBundle: async ({ dir = "dist" }, bundle) => {
      const page = bundle[HTML_FILE];

      if (page?.type !== "asset") {
        throw new Error(`${HTML_FILE} missing from the bundle`);
      }

      await writeFile(
        path.join(dir, "gallery-html.js"),
        `export const galleryHtml = ${JSON.stringify(String(page.source))};\n`,
      );
    },
  }) satisfies Plugin;

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rolldownOptions: { input: HTML_FILE },
  },
  plugins: [react(), tailwindcss(), viteSingleFile(), htmlModule()],
});
