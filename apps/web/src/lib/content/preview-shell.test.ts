import assert from "node:assert/strict";
import { test } from "node:test";

import { PREVIEW_SANDBOX } from "../preview-protocol";
import { PREVIEW_DEV_ORIGIN, previewShellHeaders, renderPreviewShell } from "./preview-shell";

test("the preview document is sandboxed by its own header", () => {
  assert.equal(previewShellHeaders["Content-Security-Policy"], `sandbox ${PREVIEW_SANDBOX}`);
  assert.equal(previewShellHeaders["X-Robots-Tag"], "noindex, nofollow");
});

test("the shell loads the component's own bundle and stylesheet", () => {
  const html = renderPreviewShell({ name: "Pop-up Book", slug: "popup-book" });

  assert.match(html, /<script type="module" src="\/previews\/popup-book\/index\.js"><\/script>/u);
  assert.match(html, /href="\/previews\/popup-book\/index\.css"/u);
  assert.match(html, /<div id="root"/u);
  assert.ok(!html.includes(PREVIEW_DEV_ORIGIN));
});

test("a dev shell boots the preview from the Vite dev server, with React Refresh first", () => {
  const html = renderPreviewShell({ dev: true, name: "Pop-up Book", slug: "popup-book" });

  const scripts = [...html.matchAll(/<script type="module"(?: src="(?<src>[^"]+)")?>/gu)].map(
    (match) => match.groups?.src ?? "inline",
  );

  assert.deepEqual(scripts, [
    "inline",
    `${PREVIEW_DEV_ORIGIN}/@vite/client`,
    `${PREVIEW_DEV_ORIGIN}/@preview/popup-book.js`,
  ]);
  assert.match(html, /__vite_plugin_react_preamble_installed__ = true/u);
  assert.ok(!html.includes("/previews/popup-book"));
});

test("the shell escapes the component name", () => {
  const html = renderPreviewShell({ name: `<img src=x onerror="alert(1)">`, slug: "x" });

  assert.ok(!html.includes("<img"));
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/u);
});
