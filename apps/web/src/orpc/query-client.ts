import { RPCSerializer } from "@orpc/client";
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

// Preserve RPC types such as Date, Map, and BigInt across hydration.
const serializer = new RPCSerializer();

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        // Hydration cannot carry FormData; keep blobs inline.
        serializeData: (data) => serializer.serialize(data, { useFormDataForBlobFields: false }),
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        // Next.js handles error redaction and uses thrown errors to detect dynamic pages.
        shouldRedactErrors: () => false,
      },
      hydrate: {
        deserializeData: (data) => serializer.deserialize(data),
      },
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });
