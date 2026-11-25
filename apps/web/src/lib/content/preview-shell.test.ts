import assert from "node:assert/strict";
import { test } from "node:test";

import { PREVIEW_SANDBOX } from "../preview-protocol";
import {
  previewAssetPath,
  previewShellHeaders,
  renderPreviewShell,
  renderUgcShell,
} from "./preview-shell";

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
