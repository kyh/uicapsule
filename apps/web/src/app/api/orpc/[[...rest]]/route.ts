import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// No CORS headers, and none belong here: the web app is the only client and it
// reaches this route same-origin. Credentialed CORS headers would hand a
// cross-origin page authenticated access. GET, the one method a cookie-bearing
// navigation can reach, is refused by the handler's default `allowMethods`.
const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    onError((error) => {
      // An ORPCError is a procedure answering deliberately — rejected input, a
      // missing row, a caller without access. Everything else is a real fault.
      if (error instanceof ORPCError) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

/**
 * The session cookie's `SameSite=Lax` only covers half of this. `SameSite` keys
 * on *site*, not origin, so a sibling subdomain of the deploy's registrable
 * domain — or merely another port on the same host in development — is
 * same-site: the browser DOES attach the session cookie to a plain
 * `<form method=POST>` served from there, and the mutation runs authenticated
 * with no preflight to stop it. oRPC ships nothing for this, and CORS is not
 * CSRF protection — a form POST needs no preflight.
 *
 * Browsers set `Origin` on every POST and page script cannot forge it, so an
 * `Origin` that isn't ours is the signal.
 *
 * Absent `Origin` passes: that is a non-browser caller, which authenticates by
 * an explicit header rather than by an ambiently-attached cookie and so has
 * nothing to forge.
 *
 * Checked at the route boundary rather than in a handler plugin so it runs once
 * on the real request, not on client-authored sub-requests should batching ever
 * be added.
 */
const isCrossOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

const handleRequest = async (req: NextRequest) => {
  if (isCrossOrigin(req)) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
