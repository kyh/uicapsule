import "server-only";
import { UGC_REQUIRED_FILES, ugcBuildKey } from "@repo/contract/ugc/ugc-schema";
import { db } from "@repo/db/drizzle-client";
import { user } from "@repo/db/drizzle-schema-auth";
import { ugcComponent } from "@repo/db/drizzle-schema-ugc";
import { list } from "@vercel/blob";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

/** The paths, relative to the build, of every file already uploaded for one build. */
export const uploadedFiles = async (prefix: string, token: string) => {
  const files = new Set<string>();
  let cursor: string | undefined;

  do {
    const page = await list({ cursor, prefix: `${prefix}/`, token });

    for (const blob of page.blobs) {
      files.add(blob.pathname.slice(prefix.length + 1));
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return files;
};

/** Whether every file the preview shell loads is in the build. */
export const isCompleteBuild = (files: Set<string>) =>
  UGC_REQUIRED_FILES.every((name) => files.has(name));

export const countComponents = async (userId: string) =>
  await db.$count(ugcComponent, eq(ugcComponent.userId, userId));

export const findOwnComponent = async (userId: string, slug: string) => {
  const [row] = await db
    .select()
    .from(ugcComponent)
    .where(and(eq(ugcComponent.userId, userId), eq(ugcComponent.slug, slug)))
    .limit(1);

  return row;
};

export const upsertComponent = async (values: {
  build: string;
  name: string;
  slug: string;
  userId: string;
}) => {
  const [row] = await db
    .insert(ugcComponent)
    .values({ ...values, id: crypto.randomUUID() })
    .onConflictDoUpdate({
      set: { build: values.build, name: values.name, updatedAt: new Date() },
      target: [ugcComponent.userId, ugcComponent.slug],
    })
    .returning();

  if (!row) {
    throw new Error("Upsert returned no row");
  }

  return row;
};

export const listOwnComponents = async (userId: string) =>
  await db
    .select()
    .from(ugcComponent)
    .where(eq(ugcComponent.userId, userId))
    .orderBy(desc(ugcComponent.updatedAt));

/**
 * The component published at `/u/<handle>/<slug>`, or undefined. `buildKey` is its Blob key
 * prefix; the caller resolves it against the assets store's public URL.
 */
export const findPublishedComponent = async (handle: string, slug: string) => {
  const [row] = await db
    .select({ build: ugcComponent.build, name: ugcComponent.name, userId: ugcComponent.userId })
    .from(ugcComponent)
    .innerJoin(user, eq(user.id, ugcComponent.userId))
    .where(and(eq(user.username, handle), eq(ugcComponent.slug, slug)))
    .limit(1);

  return row && { buildKey: ugcBuildKey(row.userId, slug, row.build), name: row.name };
};

/** The account an MCP access token's subject names, or undefined. */
export const findPublisher = async (userId: string) => {
  const [row] = await db
    .select({ id: user.id, username: user.username })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row;
};

const uniqueViolation = z.object({
  cause: z.object({ extendedCode: z.literal("SQLITE_CONSTRAINT_UNIQUE") }),
});

const setUsernameOnce = async (userId: string, username: string) => {
  try {
    return await db
      .update(user)
      .set({ username })
      .where(and(eq(user.id, userId), isNull(user.username)))
      .returning({ username: user.username });
  } catch (error) {
    if (uniqueViolation.safeParse(error).success) {
      return [];
    }

    throw error;
  }
};

/**
 * Gives an account without a username this one, and returns the username the account ends up
 * with: this one, or the one it already had, since a username is set once and then names every
 * URL the account publishes. Undefined when another account holds the name. The unique column
 * decides, so two claims racing for one name get one winner and one undefined.
 */
export const claimUsername = async (userId: string, username: string) => {
  const claimed = await setUsernameOnce(userId, username);

  if (claimed.length > 0) {
    return username;
  }

  const [account] = await db
    .select({ username: user.username })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return account?.username ?? undefined;
};
