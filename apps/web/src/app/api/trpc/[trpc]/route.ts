import type { NextRequest } from "next/server";
import { appRouter, createTRPCContext } from "@repo/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, so opening it up would only widen the cross-site surface —
// which the tRPC mutation origin guard (see packages/api/src/trpc.ts) exists to
// shrink.

// Control flow, not faults — logging these buries real errors in noise. FORBIDDEN
// in particular is what the origin guard in packages/api/src/trpc.ts raises on
// every crawler and probe; UNAUTHORIZED is every logged-out call to a protected
// procedure. Don't "restore" the logging for these.
const EXPECTED_ERROR_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST"]);

const handler = async (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: ({ error, path }) => {
      if (EXPECTED_ERROR_CODES.has(error.code)) return;
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

export { handler as GET, handler as POST };
