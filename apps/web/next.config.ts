import type { NextConfig } from "next";

import { withEve } from "eve/next";

import { siteConfig } from "./src/lib/site-config";

type ImageConfig = NonNullable<NextConfig["images"]>;

type RemotePatterns = NonNullable<ImageConfig["remotePatterns"]>;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
const PREVIEW_URL = process.env.NEXT_PUBLIC_PREVIEW_URL;

const previewHostRedirects = () => {
  if (PREVIEW_URL === undefined || PREVIEW_URL === "") {
    return [];
  }

  const { hostname } = new URL(PREVIEW_URL);

  return [
    {
      destination: `${siteConfig.url}/:path*`,
      has: [{ type: "host" as const, value: hostname }],
      permanent: false,
      source: "/:path((?!preview-frame/|previews/|_next/).*)",
    },
  ];
};

const getRemotePatterns = () => {
  const remotePatterns: RemotePatterns = [];

  if (ASSETS_URL !== undefined && ASSETS_URL !== "") {
    const { hostname } = new URL(ASSETS_URL);

    remotePatterns.push({
      hostname,
      protocol: "https",
    });
  }

  if (!IS_PRODUCTION) {
    remotePatterns.push(
      {
        hostname: "127.0.0.1",
        protocol: "http",
      },
      {
        hostname: "localhost",
        protocol: "http",
      },
    );
  }

  return remotePatterns;
};

const transpilePackages = [
  "@repo/contract",
  "@repo/db",
  "@repo/mcp-app",
  "@repo/service",
  "@repo/ui",
];

export const nextConfig: NextConfig = {
  /** next dev rewrites AGENTS.md/CLAUDE.md when it detects an agent; we own those files */
  agentRules: false,
  cacheComponents: true,
  /** cover/PR recordings capture cold navigations; the badge can't be stripped in time */
  devIndicators: false,
  /** previews run on an opaque origin, so their module scripts and chunks are CORS fetches */
  headers: async () =>
    await Promise.resolve([
      {
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
        source: "/previews/:path*",
      },
      {
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
        source: "/previews/:dir(chunks|assets)/:file*",
      },
    ]),
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: getRemotePatterns(),
  },
  /** a default <Link> prefetches only the route's shared App Shell; gallery cards opt into more on intent */
  partialPrefetching: true,
  redirects: async () => await Promise.resolve(previewHostRedirects()),
  transpilePackages,
};

const AGENT_ALIAS = { destination: "/eve/v1/:path+", source: "/agent/v1/:path+" };

const withAgentAlias = (config: NextConfig) => {
  const { rewrites } = config;

  return {
    ...config,
    rewrites: async () => {
      const existing = await rewrites?.();

      if (existing === undefined) {
        return { beforeFiles: [AGENT_ALIAS] };
      }

      if (Array.isArray(existing)) {
        return { afterFiles: existing, beforeFiles: [AGENT_ALIAS] };
      }

      return { ...existing, beforeFiles: [AGENT_ALIAS, ...(existing.beforeFiles ?? [])] };
    },
  } satisfies NextConfig;
};

const config = async (...args: Parameters<ReturnType<typeof withEve<NextConfig>>>) =>
  withAgentAlias(await withEve(nextConfig)(...args));

export default config;
