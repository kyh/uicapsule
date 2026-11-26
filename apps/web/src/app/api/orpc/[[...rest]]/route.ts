import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/service";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { isAllowedOrigin } from "@/lib/request-origin";

const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    async (options) => {
      try {
        return await options.next();
      } catch (error) {
        if (!(error instanceof ORPCError)) {
          console.error(">>> oRPC Error", error);
        }

        throw error;
      }
    },
  ],
});

const handleRequest = async (req: NextRequest) => {
  if (!isAllowedOrigin(req)) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

  const { response } = await handler.handle(req, {
    context: createORPCContext(req.headers),
    prefix: "/api/orpc",
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
