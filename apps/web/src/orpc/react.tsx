"use client";

import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClientProvider } from "@tanstack/react-query";

import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createQueryClient } from "./query-client";

let browserQueryClient: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  return (browserQueryClient ??= createQueryClient());
};

const link = new RPCLink({
  origin: getBaseUrl,
  url: "/api/orpc",
  headers: () => ({ "x-orpc-source": "nextjs-react" }),
  interceptors: [
    onError((error) => {
      if (process.env.NODE_ENV === "development") console.error(error);
    }),
  ],
});

const client: RouterClient<AppRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

export const ORPCReactProvider = (props: { children: ReactNode }) => {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
};

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
