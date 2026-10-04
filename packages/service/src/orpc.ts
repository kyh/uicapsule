import { contract } from "@repo/contract";
import { implement, ORPCError, os as builder } from "@orpc/server";

import { auth } from "./auth/auth";

// Session lookup lives in the middleware so public procedures never touch the database.
export const createORPCContext = (headers: Headers) => ({ headers });

type ORPCContext = ReturnType<typeof createORPCContext>;

/** Implements @repo/contract. `.use` on the implementer runs before input validation, so
 * anonymous callers get UNAUTHORIZED rather than BAD_REQUEST; `.use` on a procedure runs after it.
 * Feature routers are plain objects: `.router()` would re-apply implementer middleware. */
export const os = implement(contract).$context<ORPCContext>();

/** Pairs with `protectedBase`. Apply as `os.<feature>.use(requireSession)`. */
export const requireSession = builder
  .$context<ORPCContext>()
  .middleware(async ({ context, next }) => {
    const session = await auth.api.getSession({ headers: context.headers });
    if (!session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "You must be logged in to access this resource",
      });
    }
    return next({ context: { session } });
  });
