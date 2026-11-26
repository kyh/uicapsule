#!/usr/bin/env tsx
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { chromium } from "playwright";

import {
  contentMetaSchema,
  coverMediaSchema,
  coverStillKey,
} from "../apps/web/src/lib/content/content-schema";
import type { CoverMedia, HomeMedia } from "../apps/web/src/lib/content/content-schema";

const repoRoot = path.resolve(import.meta.dirname, "..");
const webRoot = path.join(repoRoot, "apps/web");
const coverMediaFile = path.join(webRoot, "src/lib/content/cover-media.json");
const homeMediaFile = path.join(webRoot, "src/lib/content/home-media.json");

const FPS = 30;
const WIDTH = 1200;
const HEIGHT = 630;
const POSTER_AT = 8.3;

const run = (command: string, args: string[]) =>
  execFileSync(command, args, { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });

const blobToken = async () => {
  if (process.env.BLOB_READ_WRITE_TOKEN !== undefined && process.env.BLOB_READ_WRITE_TOKEN !== "") {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  const local = await readFile(path.join(repoRoot, ".env.local"), "utf-8").catch(() => "");
  const token = parseEnv(local).BLOB_READ_WRITE_TOKEN;

  if (token === undefined || token === "") {
    throw new Error("BLOB_READ_WRITE_TOKEN is unset and missing from .env.local");
  }

  return token;
};

const exists = async (key: string, token: string) => {
  try {
    await head(key, { token });

    return true;
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return false;
    }

    throw error;
  }
};

const upload = async (key: string, file: string, contentType: string, token: string) => {
  await put(key, await readFile(file), { access: "public", contentType, token });
  consola.info(`uploaded ${key}`);
};

const stamp = () => new Date().toLocaleDateString("sv").replaceAll("-", "");

const freeStem = async (stem: string, extension: string, token: string) => {
  for (let attempt = 1; ; attempt += 1) {
    const candidate = attempt === 1 ? `${stem}.${stamp()}` : `${stem}.${stamp()}-${attempt}`;

    if (!(await exists(`${candidate}.${extension}`, token))) {
      return candidate;
    }
  }
};

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

const logoPath = async () => {
  const source = await readFile(
    path.join(repoRoot, "packages/ui/src/components/logo.tsx"),
    "utf-8",
  );

  const match = /\sd="(?<d>[^"]+)"/u.exec(source);

  if (
    match === null ||
    match.groups === undefined ||
    match.groups.d === undefined ||
    match.groups.d === ""
  ) {
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

  const video = path.join(work, "og.mp4");
  const poster = path.join(work, "og.jpg");
  encode(frames, video);

  const posterFrame = path.join(
    frames,
    `${String(Math.round(POSTER_AT * FPS)).padStart(4, "0")}.png`,
  );

  run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    posterFrame,
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    "-q:v",
    "2",
    poster,
  ]);

  const token = await blobToken();
  const stem = await freeStem("og/og", "mp4", token);

  const media = {
    poster: `${stem}.jpg`,
    video: `${stem}.mp4`,
  } satisfies HomeMedia;

  await upload(media.video, video, "video/mp4", token);
  await upload(media.poster, poster, "image/jpeg", token);
  await writeFile(homeMediaFile, `${JSON.stringify(media, null, 2)}\n`);
  await rm(work, { force: true, recursive: true });
  consola.success(`wrote home-media.json: ${media.video} and its poster`);
};

const assetsUrl = async () => {
  if (
    process.env.NEXT_PUBLIC_ASSETS_URL !== undefined &&
    process.env.NEXT_PUBLIC_ASSETS_URL !== ""
  ) {
    return process.env.NEXT_PUBLIC_ASSETS_URL;
  }

  const example = await readFile(path.join(repoRoot, ".env.example"), "utf-8");
  const match = /^NEXT_PUBLIC_ASSETS_URL="?(?<url>[^"\n]+)"?/mu.exec(example);

  if (
    match === null ||
    match.groups === undefined ||
    match.groups.url === undefined ||
    match.groups.url === ""
  ) {
    throw new Error("NEXT_PUBLIC_ASSETS_URL is unset and missing from .env.example");
  }

  return match.groups.url;
};

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

const uploadDate = (slug: string, cover: string) => {
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

  return date || new Date().toLocaleDateString("sv");
};

const readCoverMedia = async () => {
  const source = await readFile(coverMediaFile, "utf-8").catch(() => "{}");
  const parsed = coverMediaSchema.array().safeParse(Object.values(JSON.parse(source)));

  if (!parsed.success) {
    consola.warn("cover-media.json is malformed, re-probing every cover");

    return new Map();
  }

  return new Map(parsed.data.map((entry) => [entry.cover, entry]));
};

const probeCovers = async (force: boolean) => {
  const base = await assetsUrl();
  const contentRoot = path.join(repoRoot, "content");
  const entries = await readdir(contentRoot, { withFileTypes: true });

  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();

  const token = await blobToken();
  const work = await mkdtemp(path.join(tmpdir(), "og-stills-"));
  const previous = force ? new Map<string, CoverMedia>() : await readCoverMedia();

  const media: Record<string, CoverMedia> = {};

  for (const slug of slugs) {
    const metaSource = await readFile(path.join(contentRoot, slug, "meta.json"), "utf-8");
    const { cover } = contentMetaSchema.parse(JSON.parse(metaSource));

    if (cover?.endsWith(".mp4") !== true) {
      consola.warn(`${slug}: no mp4 cover, skipped`);
      continue;
    }

    const kept = previous.get(cover);

    if (kept) {
      media[slug] = kept;
      continue;
    }

    const url = `${base}/${cover}`;
    const { codec, duration, height, width } = probe(url);

    if (codec !== "h264") {
      consola.warn(`${slug}: cover is ${codec}, not h264 — og:video wants H.264 mp4, skipped`);
      continue;
    }

    const still = path.join(work, `${slug}.jpg`);
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
      still,
    ]);

    const stillKey = coverStillKey(cover);

    if (await exists(stillKey, token)) {
      consola.info(`${slug}: ${stillKey} already uploaded, kept`);
    } else {
      await upload(stillKey, still, "image/jpeg", token);
    }

    media[slug] = {
      cover,
      duration: Math.round(duration * 100) / 100,
      height,
      uploadDate: uploadDate(slug, cover),
      width,
    };
    consola.info(`${slug}: ${width}x${height} ${duration.toFixed(1)}s`);
  }

  await rm(work, { force: true, recursive: true });
  await writeFile(coverMediaFile, `${JSON.stringify(media, null, 2)}\n`);
  const probed = Object.values(media).filter((entry) => !previous.has(entry.cover)).length;
  consola.success(
    `wrote ${Object.keys(media).length} entries to cover-media.json (${probed} probed)`,
  );
};

const main = defineCommand({
  args: {
    force: {
      description: "covers: re-probe every cover, not only new or changed ones",
      type: "boolean",
    },
    only: {
      description: "Run one step: scene | covers",
      type: "string",
    },
  },
  meta: { description: "Render the home og:video and index component cover videos" },
  run: async ({ args }) => {
    if (args.only === undefined || args.only === "" || args.only === "covers") {
      await probeCovers(Boolean(args.force));
    }

    if (args.only === undefined || args.only === "" || args.only === "scene") {
      await renderScene();
    }
  },
});

await runMain(main);
