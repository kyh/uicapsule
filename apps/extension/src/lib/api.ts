import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractClient, RouterInputs } from "@repo/contract";
import { z } from "zod";

const uploadResponseSchema = z.object({
  message: z.string().optional(),
  url: z.string().optional(),
});

const clientFor = (serviceUrl: string) => {
  const client: ContractClient = createORPCClient(
    new RPCLink({
      fetch: async (request, init) => await fetch(request, { ...init, credentials: "omit" }),
      origin: serviceUrl,
      url: "/api/orpc",
    }),
  );

  return client;
};

export const uploadAttachment = async (serviceUrl: string, file: File) => {
  const body = new FormData();
  body.set("file", file);

  const response = await fetch(`${serviceUrl}/api/request/attachments`, {
    body,
    credentials: "omit",
    method: "POST",
  });

  const parsed = uploadResponseSchema.safeParse(await response.json().catch(() => ({})));
  const url = parsed.data?.url;

  if (!response.ok || url === undefined || url === "") {
    throw new Error(parsed.data?.message ?? `Upload failed (${response.status}).`);
  }

  return url;
};

export const fileRequest = async (serviceUrl: string, request: RouterInputs["request"]["create"]) =>
  await clientFor(serviceUrl).request.create(request);
