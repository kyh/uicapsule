import { RPCSerializer } from "@orpc/client";
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

// oRPC's own serializer, so dehydrated data round-trips every type the RPC
// protocol supports (Date, Map, Set, BigInt, URL, RegExp) — plain JSON would
// hand the client a string where the server had a Date.
const serializer = new RPCSerializer();

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // FormData cannot ride the hydration payload into the browser, so keep
        // blobs inline in the JSON.
        serializeData: (data) => serializer.serialize(data, { useFormDataForBlobFields: false }),
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        shouldRedactErrors: () => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false;
        },
      },
      hydrate: {
        deserializeData: (data) => serializer.deserialize(data),
      },
    },
  });

  return queryClient;
};
