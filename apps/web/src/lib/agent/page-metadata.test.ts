import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ogImage } from "@/lib/site-config";

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
  test("default to the site image", () => {
    assert.deepEqual(pageOpenGraph("/")?.images, [ogImage]);
    assert.deepEqual(pageTwitter()?.images, [ogImage]);
  });

  test("carry a page's card in both tags when given one", () => {
    const image = shareCardImage("/terms", "Terms of Use");
    assert.deepEqual(pageOpenGraph("/terms", "Terms of Use", "d", { image })?.images, [image]);
    assert.deepEqual(pageTwitter("Terms of Use", "d", { image })?.images, [image]);
  });

  test("restate the creator and add og:video only when asked", () => {
    assert.equal(pageTwitter()?.creator, "@kaiyuhsu");
    const openGraph = pageOpenGraph("/");
    assert.ok(openGraph && !Object.keys(openGraph).includes("videos"), "no videos key");
    const videos = ogVideo("https://www.uicapsule.com/og/og.mp4", 1200, 630);
    assert.deepEqual(pageOpenGraph("/", undefined, undefined, { videos })?.videos, videos);
  });
});
