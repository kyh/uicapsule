#!/usr/bin/env tsx
/**
 * Social video assets. Run by hand (`pnpm og:video`), never by verify or build.
 *
 * - `scene`: renders scripts/og-video/scene.html — an evergreen trailer of
 *   wireframe UI primitives ending on the mark — frame by frame in Chromium at
 *   2x, then downscales and encodes it to apps/web/public/og/og.mp4 (the home
 *   page's og:video) plus a poster, og.jpg.
 * - `covers`: probes every component's existing cover video in the assets
 *   store and writes apps/web/src/lib/content/cover-media.json (size, length,
 *   upload date — what og:video and VideoObject need), plus a still per
 *   component at apps/web/public/og/covers/<slug>.jpg for its OG image.
 *   Re-run after a cover changes; a stale entry is ignored, not trusted.
 *
 * Needs ffmpeg/ffprobe and git on PATH, and Playwright's Chromium
 * (`pnpm exec playwright install chromium` once) for `scene`.
 */
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { chromium } from "playwright";

import { contentMetaSchema } from "../apps/web/src/lib/content/content-schema";

const repoRoot = path.resolve(import.meta.dirname, "..");
const webRoot = path.join(repoRoot, "apps/web");
const ogDir = path.join(webRoot, "public/og");
const coverStillDir = path.join(ogDir, "covers");
const coverMediaFile = path.join(webRoot, "src/lib/content/cover-media.json");

const FPS = 30;
const WIDTH = 1200;
const HEIGHT = 630;
const POSTER_AT = 9;

const run = (command: string, args: string[]): string =>
  execFileSync(command, args, { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });

const encode = (framesDir: string, out: string) =>
  run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(framesDir, "%04d.png"),
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p`,
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-crf",
    "24",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    out,
  ]);

const logoPath = async (): Promise<string> => {
  const source = await readFile(
    path.join(repoRoot, "packages/ui/src/components/logo.tsx"),
    "utf-8",
  );
  const match = /\sd="(?<d>[^"]+)"/u.exec(source);
  if (!match?.groups?.d) {
    throw new Error("could not find the logo path in logo.tsx");
  }
  return match.groups.d;
};

const renderScene = async () => {
  const work = await mkdtemp(path.join(tmpdir(), "og-video-"));
  const frames = path.join(work, "frames");
  await mkdir(frames);
  await copyFile(path.join(repoRoot, "scripts/og-video/scene.html"), path.join(work, "scene.html"));
  await copyFile(path.join(webRoot, "src/app/styles/mono.woff2"), path.join(work, "mono.woff2"));

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      deviceScaleFactor: 2,
      viewport: { height: HEIGHT, width: WIDTH },
    });
    await page.goto(pathToFileURL(path.join(work, "scene.html")).href);
    const d = await logoPath();
    // String expressions: the scene's globals live in the page, not this file's lib.
    const duration: unknown = await page.evaluate(
      `setLogo(${JSON.stringify(d)}); document.fonts.ready.then(() => DURATION)`,
    );
    if (!Number.isFinite(Number(duration))) {
      throw new TypeError("scene.html did not expose DURATION");
    }

    const total = Math.round(Number(duration) * FPS);
    for (let frame = 0; frame < total; frame += 1) {
      await page.evaluate(`renderAt(${frame / FPS})`);
      await page.screenshot({ path: path.join(frames, `${String(frame).padStart(4, "0")}.png`) });
    }
    consola.info(`rendered ${total} frames`);
  } finally {
    await browser.close();
  }

  await mkdir(ogDir, { recursive: true });
  const video = path.join(ogDir, "og.mp4");
  encode(frames, video);
  const posterFrame = path.join(frames, `${String(POSTER_AT * FPS).padStart(4, "0")}.png`);
  run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    posterFrame,
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    "-q:v",
    "3",
    path.join(ogDir, "og.jpg"),
  ]);
  await rm(work, { force: true, recursive: true });
  consola.success(`wrote ${path.relative(repoRoot, video)} and og.jpg`);
};

const assetsUrl = async (): Promise<string> => {
  if (process.env.NEXT_PUBLIC_ASSETS_URL) {
    return process.env.NEXT_PUBLIC_ASSETS_URL;
  }
  const example = await readFile(path.join(repoRoot, ".env.example"), "utf-8");
  const match = /^NEXT_PUBLIC_ASSETS_URL="?(?<url>[^"\n]+)"?/mu.exec(example);
  if (!match?.groups?.url) {
    throw new Error("NEXT_PUBLIC_ASSETS_URL is unset and missing from .env.example");
  }
  return match.groups.url;
};

interface CoverMedia {
  cover: string;
  duration: number;
  height: number;
  still: string;
  uploadDate: string;
  width: number;
}

const probe = (url: string) => {
  const [codec = "", width = "", height = ""] = run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=codec_name,width,height",
    "-of",
    "csv=p=0",
    url,
  ])
    .trim()
    .split(",");
  const duration = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    url,
  ]).trim();
  return { codec, duration: Number(duration), height: Number(height), width: Number(width) };
};

/**
 * When the cover was published: the commit that wrote its key into meta.json.
 * The store's own Last-Modified is the edge cache's fetch time, not the upload.
 */
const uploadDate = (slug: string, cover: string): string => {
  const date = run("git", [
    "-C",
    repoRoot,
    "log",
    "-1",
    "--format=%cs",
    `-S${cover}`,
    "--",
    `content/${slug}/meta.json`,
  ]).trim();
  return date || new Date().toISOString().slice(0, 10);
};

const probeCovers = async () => {
  const base = await assetsUrl();
  const contentRoot = path.join(repoRoot, "content");
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
  await mkdir(coverStillDir, { recursive: true });

  const media: Record<string, CoverMedia> = {};
  for (const slug of slugs) {
    const metaSource = await readFile(path.join(contentRoot, slug, "meta.json"), "utf-8");
    const { cover } = contentMetaSchema.parse(JSON.parse(metaSource));
    if (!cover?.endsWith(".mp4")) {
      consola.warn(`${slug}: no mp4 cover, skipped`);
      continue;
    }
    const url = `${base}/${cover}`;
    const { codec, duration, height, width } = probe(url);
    if (codec !== "h264") {
      consola.warn(`${slug}: cover is ${codec}, not h264 — og:video wants H.264 mp4, skipped`);
      continue;
    }
    const still = `/og/covers/${slug}.jpg`;
    run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      (duration * 0.45).toFixed(2),
      "-i",
      url,
      "-frames:v",
      "1",
      "-vf",
      "scale=1200:675:force_original_aspect_ratio=increase,crop=1200:675",
      "-q:v",
      "4",
      path.join(webRoot, "public", still),
    ]);
    media[slug] = {
      cover,
      duration: Math.round(duration * 100) / 100,
      height,
      still,
      uploadDate: uploadDate(slug, cover),
      width,
    };
    consola.info(`${slug}: ${width}x${height} ${duration.toFixed(1)}s`);
  }
  await writeFile(coverMediaFile, `${JSON.stringify(media, null, 2)}\n`);
  consola.success(`wrote ${Object.keys(media).length} entries to cover-media.json`);
};

const main = defineCommand({
  args: {
    only: {
      description: "Run one step: scene | covers",
      type: "string",
    },
  },
  meta: { description: "Render the home og:video and index component cover videos" },
  run: async ({ args }) => {
    if (!args.only || args.only === "covers") {
      await probeCovers();
    }
    if (!args.only || args.only === "scene") {
      await renderScene();
    }
  },
});

await runMain(main);
