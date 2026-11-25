import { PREVIEW_SANDBOX } from "../preview-protocol";

/** Public path of the bundles `scripts/build-previews.ts` writes for one component. */
export const previewAssetPath = (slug: string) => `/previews/${encodeURIComponent(slug)}`;

/** Classes the shell itself puts on `<html>` and `<body>`; every preview stylesheet must emit them. */
export const PREVIEW_SHELL_CLASSES = {
  body: "bg-background text-foreground font-sans antialiased h-full",
  html: "h-full",
} as const;

/** Headers every preview document is served with. */
export const previewShellHeaders = {
  "Content-Security-Policy": `sandbox ${PREVIEW_SANDBOX}`,
  "Content-Type": "text/html; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

const ESCAPES = new Map([
  ['"', "&quot;"],
  ["&", "&amp;"],
  ["'", "&#39;"],
  ["<", "&lt;"],
  [">", "&gt;"],
]);

const escapeHtml = (value: string) =>
  value.replaceAll(/["&'<>]/gu, (char) => ESCAPES.get(char) ?? char);

const THEME_BOOT =
  'document.documentElement.classList.add(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")';

/** The HTML document that boots one component's preview bundle. */
export const renderPreviewShell = ({ slug, name }: { slug: string; name: string }) => {
  const base = escapeHtml(previewAssetPath(slug));

  return [
    "<!doctype html>",
    `<html lang="en" class="${PREVIEW_SHELL_CLASSES.html}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    `<title>${escapeHtml(name)} · UICapsule preview</title>`,
    `<script>${THEME_BOOT}</script>`,
    `<link rel="stylesheet" href="${base}/tailwind.css">`,
    `<link rel="stylesheet" href="${base}/index.css">`,
    `<script type="module" src="${base}/index.js"></script>`,
    "</head>",
    `<body class="${PREVIEW_SHELL_CLASSES.body}">`,
    '<div id="root" style="display:contents"></div>',
    "</body>",
    "</html>",
  ].join("\n");
};
