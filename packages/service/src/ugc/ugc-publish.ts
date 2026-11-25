import "server-only";
import {
  newUgcBuild,
  ugcBuildKey,
  ugcContentType,
  ugcFileKey,
  ugcPath,
} from "@repo/contract/ugc/ugc-schema";
import type { CreateUploadInput, PublishInput } from "@repo/contract/ugc/ugc-schema";
import { ORPCError } from "@orpc/server";

import { auth, canonicalOrigin } from "../auth/auth";
import { signUploadGrant } from "./ugc-upload-token";
import {
  countComponents,
  findOwnComponent,
  isCompleteBuild,
  listOwnComponents,
  upsertComponent,
  uploadedFiles,
} from "./ugc-store";

const UPLOAD_WINDOW_MS = 15 * 60 * 1000;

/** Most components one account may publish. */
export const UGC_MAX_COMPONENTS = 100;

/** Who is publishing: the signed-in account, from a session or an MCP access token. */
export interface Publisher {
  id: string;
  username?: string | null | undefined;
}

/** The Blob read-write token publishing writes and lists with. */
export const blobToken = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new ORPCError("SERVICE_UNAVAILABLE", { message: "Publishing is not configured" });
  }

  return token;
};

const assetsUrl = () => {
  const url = process.env.NEXT_PUBLIC_ASSETS_URL;

  if (!url) {
    throw new ORPCError("SERVICE_UNAVAILABLE", { message: "Publishing is not configured" });
  }

  return url;
};

const requireHandle = (username: string | null | undefined) => {
  if (!username) {
    throw new ORPCError("PRECONDITION_FAILED", {
      message: "Pick a username first: it is the /u/<username> your components live under",
    });
  }

  return username;
};

const assertQuota = async (userId: string, slug: string) => {
  if (
    !(await findOwnComponent(userId, slug)) &&
    (await countComponents(userId)) >= UGC_MAX_COMPONENTS
  ) {
    throw new ORPCError("FORBIDDEN", {
      message: `An account can publish up to ${UGC_MAX_COMPONENTS} components`,
    });
  }
};

const published = (
  handle: string,
  row: { build: string; name: string; slug: string; updatedAt: Date },
) => ({
  build: row.build,
  handle,
  name: row.name,
  path: ugcPath(handle, row.slug),
  slug: row.slug,
  updatedAt: row.updatedAt,
});

/** Starts a build: checks the account may publish the slug, and names the build's public URL. */
export const startBuild = async (publisher: Publisher, slug: string) => {
  requireHandle(publisher.username);
  await assertQuota(publisher.id, slug);
  const build = newUgcBuild();

  return { assetBase: `${assetsUrl()}/${ugcBuildKey(publisher.id, slug, build)}`, build };
};

/** One signed upload URL per file of the build, skipping files already uploaded. */
export const createUploads = async (publisher: Publisher, input: CreateUploadInput) => {
  requireHandle(publisher.username);
  await assertQuota(publisher.id, input.slug);

  const buildKey = ugcBuildKey(publisher.id, input.slug, input.build);
  const existing = await uploadedFiles(buildKey, blobToken());
  const { secret } = await auth.$context;
  const expiresAt = Date.now() + UPLOAD_WINDOW_MS;

  const uploads = input.files
    .filter((file) => !existing.has(file.path))
    .map(({ path, size }) => {
      const contentType = ugcContentType(path) ?? "application/octet-stream";
      const pathname = ugcFileKey(publisher.id, input.slug, input.build, path);
      const token = signUploadGrant({ contentType, expiresAt, pathname, size }, secret);
      const url = new URL("/api/ugc/upload", canonicalOrigin());
      url.searchParams.set("token", token);

      return { contentType, path, url: url.href };
    });

  return { uploads };
};

/** Points the slug at a fully uploaded build, creating the component on first publish. */
export const publishBuild = async (publisher: Publisher, input: PublishInput) => {
  const handle = requireHandle(publisher.username);
  await assertQuota(publisher.id, input.slug);

  const files = await uploadedFiles(
    ugcBuildKey(publisher.id, input.slug, input.build),
    blobToken(),
  );

  if (!isCompleteBuild(files)) {
    throw new ORPCError("PRECONDITION_FAILED", {
      message: "That build is not fully uploaded: index.js and index.css are required",
    });
  }

  return published(handle, await upsertComponent({ ...input, userId: publisher.id }));
};

/** The account's published components, newest first. */
export const listPublished = async (publisher: Publisher) => {
  const handle = requireHandle(publisher.username);
  const rows = await listOwnComponents(publisher.id);

  return rows.map((row) => published(handle, row));
};
