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

/** Where `pnpm dev:previews` serves previews with hot reload; dev frames load from here. */
export const PREVIEW_DEV_ORIGIN = "http://localhost:5174";

/** Dev-server path of the module that boots one preview. */
export const previewDevEntryPath = (slug: string) => `/@preview/${encodeURIComponent(slug)}.js`;

const REACT_REFRESH_PREAMBLE = [
  `import RefreshRuntime from "${PREVIEW_DEV_ORIGIN}/@react-refresh";`,
  "RefreshRuntime.injectIntoGlobalHook(window);",
  "window.$RefreshReg$ = () => {};",
  "window.$RefreshSig$ = () => (type) => type;",
  "window.__vite_plugin_react_preamble_installed__ = true;",
].join("");

const assetTags = (slug: string, dev: boolean) => {
  if (dev) {
    return [
      `<script type="module">${REACT_REFRESH_PREAMBLE}</script>`,
      `<script type="module" src="${PREVIEW_DEV_ORIGIN}/@vite/client"></script>`,
      `<script type="module" src="${PREVIEW_DEV_ORIGIN}${previewDevEntryPath(slug)}"></script>`,
    ];
  }

  const href = escapeHtml(previewAssetPath(slug));

  return [
    `<link rel="stylesheet" href="${href}/index.css">`,
    `<script type="module" src="${href}/index.js"></script>`,
  ];
};

/**
 * The HTML document that boots one component's preview: its built bundle, or with `dev` the
 * module the Vite dev server compiles on request and hot-reloads.
 */
export const renderPreviewShell = ({
  dev = false,
  name,
  slug,
}: {
  dev?: boolean;
  name: string;
  slug: string;
}) =>
  [
    "<!doctype html>",
    `<html lang="en" class="${PREVIEW_SHELL_CLASSES.html}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    `<title>${escapeHtml(name)} · UICapsule preview</title>`,
    `<script>${THEME_BOOT}</script>`,
    ...assetTags(slug, dev),
    "</head>",
    `<body class="${PREVIEW_SHELL_CLASSES.body}">`,
    '<div id="root" style="display:contents"></div>',
    "</body>",
    "</html>",
  ].join("\n");
