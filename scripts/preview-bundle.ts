import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

import { PREVIEW_SHELL_CLASSES } from "../apps/web/src/lib/content/preview-shell";

export const repoRoot = path.resolve(import.meta.dirname, "..");
export const webRoot = path.join(repoRoot, "apps/web");

export const runtimeModule = path.join(webRoot, "src/lib/content/preview-runtime.ts");
export const themeStylesheet = path.join(repoRoot, "packages/ui/src/styles/theme.css");
const SHELL_CLASSES = Object.values(PREVIEW_SHELL_CLASSES).join(" ");

/** Asset types a preview may import that Vite doesn't treat as assets on its own (3D models, HDRIs). */
export const EXTRA_ASSET_GLOBS = ["**/*.glb", "**/*.gltf", "**/*.hdr"];

/** Source of the generated entry module that styles and boots one preview inside its frame. */
export const previewEntry = (previewFile: string, stylesheet: string) =>
  [
    `import ${JSON.stringify(stylesheet)};`,
    `import Preview from ${JSON.stringify(previewFile)};`,
    `import { startPreview } from ${JSON.stringify(runtimeModule)};`,
    "startPreview(Preview);",
  ].join("\n");

/** The Tailwind stylesheet for one component directory: theme tokens plus only the classes it uses. */
export const compilePreviewStylesheet = async (base: string, optimize: boolean) => {
  const result = await postcss([tailwindcss({ base, optimize })]).process(
    `@import ${JSON.stringify(themeStylesheet)};\n@source inline(${JSON.stringify(SHELL_CLASSES)});\n`,
    { from: path.join(base, "preview.tailwind.css") },
  );

  return result.css;
};
