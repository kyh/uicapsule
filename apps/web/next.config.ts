import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

type ImageConfig = NonNullable<NextConfig["images"]>;
type RemotePatterns = NonNullable<ImageConfig["remotePatterns"]>;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;

const appRoot = import.meta.dirname;
const contentRoot = path.join(appRoot, "..", "..", "content");

const getContentPackages = () => {
  try {
    return readdirSync(contentRoot)
      .filter((slug) => !slug.startsWith("."))
      .filter((slug) => existsSync(path.join(contentRoot, slug, "package.json")))
      .map((slug) => `@uicapsule/${slug}`);
  } catch {
    return [];
  }
};

const getRemotePatterns = (): RemotePatterns => {
  const remotePatterns: RemotePatterns = [];

  if (ASSETS_URL) {
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

const transpilePackages = ["@repo/api", "@repo/db", "@repo/ui", ...getContentPackages()];

const config: NextConfig = {
  /** next dev rewrites AGENTS.md/CLAUDE.md when it detects an agent; we own those files */
  agentRules: false,
  cacheComponents: true,
  /** cover/PR recordings capture cold navigations; the badge can't be stripped in time */
  devIndicators: false,
  experimental: {
    // Multiple root layouts leave app/not-found.tsx nothing to render into for unmatched URLs.
    globalNotFound: true,
  },
  /**
   * `Vary: Accept` for the Markdown content negotiation in src/proxy.ts, so a
   * shared cache keys the two representations of a URL separately.
   *
   * Applies to the route handlers (`/llms.txt`, `/sitemap.xml`, `/r/*.json`,
   * `/api/markdown/*`) and to the 406 the proxy returns directly. It does NOT
   * reach prerendered app *pages*: Next replays a prerender's stored headers
   * over the response on send, and `vary` is one of them, so both this and a
   * value set on `NextResponse.next()` are overwritten with Next's own RSC vary
   * tokens. Verified again against Next 16.3.3 — retest when upgrading.
   *
   * Harmless in the meantime: the proxy rewrites Markdown requests to a
   * different route before any cache lookup, so the HTML and Markdown variants
   * of a URL never share a cache key to begin with.
   */
  headers: () =>
    Promise.resolve([
      {
        headers: [{ key: "Vary", value: "Accept" }],
        source: "/((?!_next/|_vercel/).*)",
      },
    ]),
  images: {
    remotePatterns: getRemotePatterns(),
  },
  transpilePackages,
};

export default config;
