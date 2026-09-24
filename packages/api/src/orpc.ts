import { ORPCError, os } from "@orpc/server";

import { auth } from "./auth/auth";

// Session lookup lives in the middleware so public procedures never touch the database.
export const createORPCContext = (headers: Headers) => ({ headers });

type ORPCContext = ReturnType<typeof createORPCContext>;

export const publicProcedure = os.$context<ORPCContext>();

export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource",
    });
  }
  return next({ context: { session } });
});
