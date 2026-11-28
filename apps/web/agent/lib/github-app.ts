import type { SandboxNetworkPolicy } from "eve/sandbox";
import { createSign } from "node:crypto";
import { z } from "zod";

import { REQUEST_REPOSITORY } from "./request-trigger";

const API = "https://api.github.com";

const appEnvSchema = z.object({
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
});

const installationSchema = z.object({ id: z.number() });

const accessTokenSchema = z.object({ expires_at: z.string(), token: z.string().min(1) });

const base64url = (value: string) => Buffer.from(value).toString("base64url");

/** Signs the short-lived RS256 JWT a GitHub App presents to mint installation tokens. */
export const createAppJwt = (input: {
  readonly appId: string;
  readonly now: Date;
  readonly privateKey: string;
}) => {
  const issuedAt = Math.floor(input.now.getTime() / 1000) - 60;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));

  const payload = base64url(
    JSON.stringify({ exp: issuedAt + 600, iat: issuedAt, iss: input.appId }),
  );

  const signature = createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(input.privateKey.replaceAll(String.raw`\n`, "\n"), "base64url");

  return `${header}.${payload}.${signature}`;
};

const githubFetch = async (
  path: string,
  init: { jwt: string; method: "GET" | "POST"; body?: object },
) => {
  const response = await fetch(`${API}${path}`, {
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${init.jwt}`,
      "user-agent": "uicapsule-request-builder",
      "x-github-api-version": "2022-11-28",
    },
    method: init.method,
  });

  if (!response.ok) {
    throw new Error(`GitHub ${init.method} ${path} answered ${response.status}`);
  }

  const body: unknown = await response.json();

  return body;
};

/**
 * Mints an installation token scoped to this repository alone, with only the permissions a build
 * needs. It lasts about an hour.
 */
export const mintRepositoryToken = async () => {
  const env = appEnvSchema.parse(process.env);

  const jwt = createAppJwt({
    appId: env.GITHUB_APP_ID,
    now: new Date(),
    privateKey: env.GITHUB_APP_PRIVATE_KEY,
  });

  const [, repo] = REQUEST_REPOSITORY.split("/");

  const installation = installationSchema.parse(
    await githubFetch(`/repos/${REQUEST_REPOSITORY}/installation`, { jwt, method: "GET" }),
  );

  const access = accessTokenSchema.parse(
    await githubFetch(`/app/installations/${installation.id}/access_tokens`, {
      body: {
        permissions: { contents: "write", issues: "write", pull_requests: "write" },
        repositories: [repo],
      },
      jwt,
      method: "POST",
    }),
  );

  return { expiresAt: access.expires_at, token: access.token };
};

/**
 * Lets every host through and adds the token at the sandbox firewall for git (github.com,
 * codeload) and the API (`gh`), so the token itself never enters the sandbox.
 */
export const githubNetworkPolicy = (token: string) => {
  const basic = [
    {
      transform: [
        {
          headers: {
            authorization: `Basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
          },
        },
      ],
    },
  ];

  return {
    allow: {
      "*": [],
      "api.github.com": [{ transform: [{ headers: { authorization: `Bearer ${token}` } }] }],
      "codeload.github.com": basic,
      "github.com": basic,
    },
  } satisfies SandboxNetworkPolicy;
};
