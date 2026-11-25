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

/** The plain-text 404 a preview frame answers for anything it cannot serve. */
export const previewNotFound = () =>
  new Response("Not found", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    status: 404,
  });

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

/** The HTML document that boots one component's preview bundle, read from `base`. */
export const renderPreviewShell = ({ base, name }: { base: string; name: string }) => {
  const href = escapeHtml(base);

  return [
    "<!doctype html>",
    `<html lang="en" class="${PREVIEW_SHELL_CLASSES.html}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    `<title>${escapeHtml(name)} · UICapsule preview</title>`,
    `<script>${THEME_BOOT}</script>`,
    `<link rel="stylesheet" href="${href}/tailwind.css">`,
    `<link rel="stylesheet" href="${href}/index.css">`,
    `<script type="module" src="${href}/index.js"></script>`,
    "</head>",
    `<body class="${PREVIEW_SHELL_CLASSES.body}">`,
    '<div id="root" style="display:contents"></div>',
    "</body>",
    "</html>",
  ].join("\n");
};
