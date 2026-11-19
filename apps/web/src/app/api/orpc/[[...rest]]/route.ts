import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/service";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC interceptor API, not a Node callback
    onError((error) => {
      if (error instanceof ORPCError) {
        return;
      }

      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleRequest = async (req: NextRequest) => {
  const origin = req.headers.get("origin");

  if (origin !== null && origin !== new URL(req.url).origin) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

  const { response } = await handler.handle(req, {
    context: createORPCContext(req.headers),
    prefix: "/api/orpc",
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
