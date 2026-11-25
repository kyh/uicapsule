import { createHash } from "node:crypto";

import { UGC_SHARED_MODULES } from "@repo/contract/ugc/ugc-schema";

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

/** Where the frame's shared copy of one bare import lives, beside the curated previews. */
export const ugcSharedModulePath = (specifier: string) =>
  `/previews/_ugc/${specifier.replaceAll("/", "-")}.js`;

/** The module that imports a published bundle and boots it, and the stylesheet under it. */
export const UGC_BOOT_PATH = "/previews/_ugc/boot.js";
export const UGC_BASE_STYLESHEET_PATH = "/previews/_ugc/base.css";

const scriptHash = (source: string) =>
  `'sha256-${createHash("sha256").update(source).digest("base64")}'`;

/**
 * The document and headers for a user-published preview. `entry` is the public URL of its build;
 * `shellOrigin` is the host serving this frame and the shared modules. The import map points the
 * bundle's bare imports at the frame's one copy of React, and the CSP lets scripts run only from
 * those two origins plus the two inline scripts, so a bundle cannot pull in code from elsewhere.
 */
export const renderUgcShell = ({
  entry,
  name,
  shellOrigin,
}: {
  entry: string;
  name: string;
  shellOrigin: string;
}) => {
  const importMap = JSON.stringify({
    imports: Object.fromEntries(
      UGC_SHARED_MODULES.map((specifier) => [
        specifier,
        `${shellOrigin}${ugcSharedModulePath(specifier)}`,
      ]),
    ),
  });

  const href = escapeHtml(entry);
  const shell = escapeHtml(shellOrigin);

  const body = [
    "<!doctype html>",
    `<html lang="en" class="${PREVIEW_SHELL_CLASSES.html}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    `<meta name="uicapsule-entry" content="${href}/index.js">`,
    `<title>${escapeHtml(name)} · UICapsule preview</title>`,
    `<script>${THEME_BOOT}</script>`,
    `<script type="importmap">${importMap}</script>`,
    `<link rel="stylesheet" href="${shell}${UGC_BASE_STYLESHEET_PATH}">`,
    `<link rel="stylesheet" href="${href}/index.css">`,
    `<script type="module" src="${shell}${UGC_BOOT_PATH}"></script>`,
    "</head>",
    `<body class="${PREVIEW_SHELL_CLASSES.body}">`,
    '<div id="root" style="display:contents"></div>',
    "</body>",
    "</html>",
  ].join("\n");

  const headers = {
    ...previewShellHeaders,
    "Cache-Control": "public, max-age=0, s-maxage=60",
    "Content-Security-Policy": [
      `sandbox ${PREVIEW_SANDBOX}`,
      `script-src ${shellOrigin} ${new URL(entry).origin} ${scriptHash(THEME_BOOT)} ${scriptHash(importMap)}`,
      "object-src 'none'",
      "base-uri 'none'",
    ].join("; "),
  };

  return { body, headers };
};

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
