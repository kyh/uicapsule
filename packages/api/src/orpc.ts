import { ORPCError, os } from "@orpc/server";

import { auth } from "./auth/auth";

export const createORPCContext = async (headers: Headers) => ({
  session: await auth.api.getSession({ headers }),
});

type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

export const protectedProcedure = os.$context<ORPCContext>().use(({ context, next }) => {
  const { session } = context;
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource",
    });
  }
  return next({ context: { session } });
});
