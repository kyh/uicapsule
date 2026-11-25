import assert from "node:assert/strict";
import { test } from "node:test";

import { PREVIEW_SANDBOX } from "../preview-protocol";
import { previewAssetPath, previewShellHeaders, renderPreviewShell } from "./preview-shell";

test("the preview document is sandboxed by its own header", () => {
  assert.equal(previewShellHeaders["Content-Security-Policy"], `sandbox ${PREVIEW_SANDBOX}`);
  assert.equal(previewShellHeaders["X-Robots-Tag"], "noindex, nofollow");
});

test("the shell loads the component's own bundle and stylesheets", () => {
  const html = renderPreviewShell({
    base: previewAssetPath("popup-book"),
    name: "Pop-up Book",
  });

  assert.match(html, /<script type="module" src="\/previews\/popup-book\/index\.js"><\/script>/u);
  assert.match(html, /href="\/previews\/popup-book\/tailwind\.css"/u);
  assert.match(html, /href="\/previews\/popup-book\/index\.css"/u);
  assert.match(html, /<div id="root"/u);
});

test("the shell escapes the component name", () => {
  const html = renderPreviewShell({ base: "/previews/x", name: `<img src=x onerror="alert(1)">` });

  assert.ok(!html.includes("<img"));
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/u);
});
