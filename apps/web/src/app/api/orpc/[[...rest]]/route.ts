import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { SimpleCsrfProtectionHandlerPlugin } from "@orpc/server/plugins";

// No CORS headers: the web app is the only client and reaches this route
// same-origin, so opening it up would only widen the cross-site surface.
//
// SimpleCsrfProtection requires an `x-csrf-token` header, which the paired link
// plugin sends and an HTML form cannot set — and a cross-origin fetch that
// tries to set it needs a preflight this route never answers. better-auth's own
// Origin checks only cover /api/auth/*, so this is what guards /api/orpc; auth
// cookies are SameSite=Lax, which makes it defence-in-depth layered under
// session auth rather than the only line. Adding permissive CORS headers here
// would let the preflight succeed and undo it.

// Errors that are normal control flow, not server faults: unauthenticated,
// forbidden, missing row, rejected input, and requests the transport plugins
// turn away (header-less CSRF probes, GETs on POST-only procedures). Logging
// them would just add noise.
const EXPECTED_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_REQUEST",
  "CSRF_TOKEN_MISMATCH",
  "METHOD_NOT_SUPPORTED",
]);

const handler = new RPCHandler(appRouter, {
  plugins: [new SimpleCsrfProtectionHandlerPlugin()],
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && EXPECTED_ERROR_CODES.has(error.code)) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleRequest = async (req: NextRequest) => {
  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
