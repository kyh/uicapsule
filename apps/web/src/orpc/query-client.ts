import { RPCSerializer } from "@orpc/client";
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

const serializer = new RPCSerializer();

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: (data) => serializer.serialize(data, { useFormDataForBlobFields: false }),
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
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
