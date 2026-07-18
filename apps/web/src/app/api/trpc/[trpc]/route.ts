import type { NextRequest } from "next/server";
import { appRouter, createTRPCContext } from "@repo/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, so opening it up would only widen the cross-site surface —
// which the tRPC mutation origin guard (see packages/api/src/trpc.ts) exists to
// shrink.
const handler = async (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: ({ error, path }) => {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

export { handler as GET, handler as POST };
