import { db } from "@repo/db/drizzle-client";
import { ORPCError, os } from "@orpc/server";

import { auth } from "./auth/auth";

/**
 * Builds the per-request context. Callers supply headers rather than reading
 * them here, so the same code serves the fetch handler and any future
 * in-process caller, which have no shared request object.
 *
 * @see https://orpc.dev/docs/context
 */
export const createORPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return { session, db };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

const o = os.$context<ORPCContext>();

/**
 * Unauthenticated procedure. Does not require a session, but `context.session`
 * is still populated when the caller happens to be logged in.
 */
export const publicProcedure = o;

/**
 * Requires a session, and narrows `context.session.user` to non-nullable for
 * the handler.
 *
 * @see https://orpc.dev/docs/procedure
 */
export const protectedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    context: {
      // infers the `session` as non-nullable
      session: { ...context.session, user: context.session.user },
    },
  });
});
