import assert from "node:assert/strict";
import { test } from "node:test";

import { PREVIEW_SANDBOX } from "../preview-protocol";
import {
  PREVIEW_DEV_ORIGIN,
  previewShellHeaders,
  renderPreviewShell,
  renderUgcShell,
} from "./preview-shell";

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

const ugc = renderUgcShell({
  entry: "https://blob.example/ugc/u1/knob/0123456789abcdef",
  name: "Knob",
  shellOrigin: "https://preview.example",
});

const csp = ugc.headers["Content-Security-Policy"];

test("a user-published preview boots its Blob build through the frame's runtime", () => {
  assert.match(
    ugc.body,
    /<meta name="uicapsule-entry" content="https:\/\/blob\.example\/ugc\/u1\/knob\/0123456789abcdef\/index\.js">/u,
  );
  assert.match(
    ugc.body,
    /href="https:\/\/blob\.example\/ugc\/u1\/knob\/0123456789abcdef\/index\.css"/u,
  );
  assert.match(
    ugc.body,
    /<script type="module" src="https:\/\/preview\.example\/previews\/_ugc\/boot\.js">/u,
  );
});

test("a user-published preview's bare imports resolve to the frame's one React", () => {
  const map = /<script type="importmap">(?<map>.*?)<\/script>/u.exec(ugc.body)?.groups?.map ?? "";
  const { imports } = JSON.parse(map) as { imports: Record<string, string> };

  assert.equal(imports.react, "https://preview.example/previews/_ugc/react.js");
  assert.equal(
    imports["react/jsx-runtime"],
    "https://preview.example/previews/_ugc/react-jsx-runtime.js",
  );
  assert.equal(imports["motion/react"], "https://preview.example/previews/_ugc/motion-react.js");
});

test("a user-published preview may only run scripts from the frame and its bundle origin", () => {
  assert.ok(csp.startsWith(`sandbox ${PREVIEW_SANDBOX}; `));
  assert.match(
    csp,
    /script-src https:\/\/preview\.example https:\/\/blob\.example 'sha256-[\w+/]+=*' 'sha256-[\w+/]+=*';/u,
  );
  assert.match(csp, /object-src 'none'/u);
  assert.ok(!csp.includes("unsafe"));
});
