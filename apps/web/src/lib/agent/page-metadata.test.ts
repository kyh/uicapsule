import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ogVideo, pageOpenGraph, pageTwitter, shareCardImage } from "./page-metadata";
import { prosePages, requestPage, sharePages } from "./site-pages";

describe("shareCardImage", () => {
  test("points at the page's /card route with its own alt", () => {
    assert.deepEqual(shareCardImage("/about", "About"), {
      alt: "About — UICapsule",
      height: 630,
      type: "image/png",
      url: "https://www.uicapsule.com/card/about",
      width: 1200,
    });
    assert.equal(
      shareCardImage("/ui/vibe-dial", "Vibe Dial").url,
      "https://www.uicapsule.com/card/ui/vibe-dial",
    );
  });
});

describe("sharePages", () => {
  test("covers every prose page and the request form, once each", () => {
    const paths = sharePages.map((page) => page.path);
    assert.deepEqual(paths, [...prosePages.map((page) => page.path), requestPage.path]);
    assert.equal(new Set(paths).size, paths.length);
  });
});

describe("pageOpenGraph / pageTwitter", () => {
  const image = shareCardImage("/terms", "Terms of Use");

  test("carry a page's card in both tags when given one", () => {
    assert.deepEqual(
      pageOpenGraph("/terms", { description: "d", image, title: "Terms of Use" })?.images,
      [image],
    );
    assert.deepEqual(pageTwitter({ description: "d", image, title: "Terms of Use" })?.images, [
      image,
    ]);
  });

  test("restate the creator and add og:video only when asked", () => {
    assert.equal(pageTwitter({ image })?.creator, "@kaiyuhsu");
    const openGraph = pageOpenGraph("/", { image });
    assert.ok(!Object.keys(openGraph).includes("videos"), "no videos key");
    const videos = ogVideo("https://assets.example.com/og/og.20261124.mp4", 1200, 630);
    assert.deepEqual(pageOpenGraph("/", { image, videos })?.videos, videos);
  });
});
