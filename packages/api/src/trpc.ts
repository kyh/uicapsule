/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { db } from "@repo/db/drizzle-client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth, trustedOrigins } from "./auth/auth";

/**
 * Builds the per-request context. Callers supply headers rather than reading
 * them here, so the same code serves the fetch handler and the in-process RSC
 * caller, which have no shared request object.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return {
    session,
    db,
    // Browser-supplied request provenance. Captured here because a tRPC
    // middleware cannot read raw request headers; read by the mutation origin
    // guard below. Both null for non-browser callers (server-to-server).
    origin: opts.headers.get("origin"),
    secFetchSite: opts.headers.get("sec-fetch-site"),
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize the tRPC API, connecting the context and transformer.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/** @see https://trpc.io/docs/server/server-side-calls */
export const createCallerFactory = t.createCallerFactory;

/** @see https://trpc.io/docs/router */
export const createTRPCRouter = t.router;

const TRUSTED_ORIGINS = new Set(trustedOrigins);

/**
 * True when a request carries browser provenance that isn't same-origin or an
 * allow-listed origin. Defence-in-depth CSRF check: better-auth's own Origin
 * checks only cover /api/auth/*, so this guards /api/trpc. Non-browser callers
 * send neither header and are left alone; session auth still applies.
 */
const isUntrustedOrigin = (origin: string | null, secFetchSite: string | null) => {
  // Sec-Fetch-Site is set by the browser and cannot be forged from script.
  if (secFetchSite === "same-origin" || secFetchSite === "none") return false;
  // No browser provenance at all — not a browser CSRF vector.
  if (!origin && !secFetchSite) return false;
  // A cross-site/same-site label, or any Origin, must match the allow-list.
  // Fail closed: a stripped Origin under a cross-site label is rejected.
  return origin === null || !TRUSTED_ORIGINS.has(origin);
};

/**
 * Rejects state-changing calls whose origin isn't trusted — defence-in-depth
 * against CSRF, layered under session auth rather than replacing it. Queries are
 * side-effect-free and pass through untouched.
 */
const enforceTrustedOriginOnMutation = t.middleware(({ ctx, type, next }) => {
  if (type === "mutation" && isUntrustedOrigin(ctx.origin, ctx.secFetchSite)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cross-origin request rejected",
    });
  }
  return next();
});

/**
 * Unauthenticated procedure. Does not require a session, but `ctx.session` is
 * still populated when the caller happens to be logged in.
 */
export const publicProcedure = t.procedure.use(enforceTrustedOriginOnMutation);

/**
 * Requires a session, and narrows `ctx.session.user` to non-nullable for the
 * handler.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
