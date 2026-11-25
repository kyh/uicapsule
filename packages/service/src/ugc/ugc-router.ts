import {
  ugcBuildKey,
  ugcContentType,
  ugcFileKey,
  ugcPath,
  ugcSlugKey,
} from "@repo/contract/ugc/ugc-schema";
import { ORPCError } from "@orpc/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

import { os, requireSession } from "../orpc";
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

const authed = os.ugc.use(requireSession);

const blobToken = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new ORPCError("SERVICE_UNAVAILABLE", { message: "Publishing is not configured" });
  }

  return token;
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

const assetsUrl = () => {
  const url = process.env.NEXT_PUBLIC_ASSETS_URL;

  if (!url) {
    throw new ORPCError("SERVICE_UNAVAILABLE", { message: "Publishing is not configured" });
  }

  return url;
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

export const ugcRouter = {
  createUpload: authed.createUpload.handler(async ({ context, input }) => {
    const { id: userId, username } = context.session.user;
    requireHandle(username);
    const token = blobToken();
    await assertQuota(userId, input.slug);

    const slugKey = ugcSlugKey(userId, input.slug);
    const existing = await uploadedFiles(slugKey, token);
    const validUntil = Date.now() + UPLOAD_WINDOW_MS;

    const uploads = await Promise.all(
      input.files
        .map((file) => ({
          ...file,
          pathname: ugcFileKey(userId, input.slug, input.build, file.path),
        }))
        .filter((file) => !existing.has(file.pathname.slice(slugKey.length + 1)))
        .map(async ({ path, pathname, size }) => {
          const contentType = ugcContentType(path) ?? "application/octet-stream";

          return {
            contentType,
            path,
            pathname,
            token: await generateClientTokenFromReadWriteToken({
              addRandomSuffix: false,
              allowOverwrite: false,
              allowedContentTypes: [contentType],
              maximumSizeInBytes: Math.max(size, 1),
              pathname,
              token,
              validUntil,
            }),
          };
        }),
    );

    return { uploads };
  }),

  prepare: authed.prepare.handler(async ({ context, input }) => {
    const { id: userId, username } = context.session.user;
    requireHandle(username);
    await assertQuota(userId, input.slug);

    return { assetBase: `${assetsUrl()}/${ugcSlugKey(userId, input.slug)}` };
  }),

  list: authed.list.handler(async ({ context }) => {
    const handle = requireHandle(context.session.user.username);
    const rows = await listOwnComponents(context.session.user.id);

    return rows.map((row) => published(handle, row));
  }),

  publish: authed.publish.handler(async ({ context, input }) => {
    const { id: userId, username } = context.session.user;
    const handle = requireHandle(username);
    const files = await uploadedFiles(ugcBuildKey(userId, input.slug, input.build), blobToken());

    if (!isCompleteBuild(files)) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message:
          "That build is not fully uploaded: index.js, index.css and tailwind.css are required",
      });
    }

    const row = await upsertComponent({ ...input, userId });

    return published(handle, row);
  }),
};
