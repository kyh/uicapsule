import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { galleryResource, galleryResourceContents, galleryToolMeta } from "./mcp-app";

describe("gallery MCP App", () => {
  test("points the tool at a versioned ui:// resource, callable by model and view", () => {
    assert.match(galleryToolMeta.ui.resourceUri, /^ui:\/\/uicapsule\/gallery-v\d+\.html$/u);
    assert.deepEqual(galleryToolMeta.ui.visibility, ["model", "app"]);
  });

  test("serves the view as an MCP App document", () => {
    const [item] = galleryResourceContents("<!doctype html>").contents;
    assert.equal(item?.uri, galleryResource.uri);
    assert.equal(item?.uri, galleryToolMeta.ui.resourceUri);
    assert.equal(item?.mimeType, "text/html;profile=mcp-app");
    assert.equal(item?.text, "<!doctype html>");
  });

  test("lets the view load covers and nothing else", () => {
    const [item] = galleryResourceContents("").contents;
    const csp = item?._meta.ui.csp;
    assert.equal(csp?.resourceDomains.length, 1);
    assert.match(csp?.resourceDomains[0] ?? "", /^https?:\/\/[^/]+$/u);
    assert.deepEqual(csp?.connectDomains, []);
    assert.deepEqual(csp?.frameDomains, []);
  });
});
