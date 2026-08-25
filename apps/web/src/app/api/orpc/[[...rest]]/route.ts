import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// No CORS headers, and none belong here: the web app is the only client and it
// reaches this route same-origin. Cross-site protection is the session cookie's
// SameSite=Lax (better-auth's default, see packages/api/src/auth/auth.ts) — a
// forged cross-site POST executes with no session and does nothing.
// Credentialed CORS headers would hand a cross-origin page authenticated access
// and undo that. GET, the one method a cookie-bearing navigation can reach, is
// refused by the handler's default `allowMethods`.
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

const handleRequest = async (req: NextRequest) => {
  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
