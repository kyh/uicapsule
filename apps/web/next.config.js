import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const contentRoot = join(__dirname, "..", "..", "content");

const getContentPackages = () => {
  try {
    return readdirSync(contentRoot)
      .filter((slug) => !slug.startsWith("."))
      .filter((slug) => existsSync(join(contentRoot, slug, "package.json")))
      .map((slug) => `@uicapsule/${slug}`);
  } catch {
    return [];
  }
};

const getRemotePatterns = () => {
  /** @type {import("next/dist/shared/lib/image-config").RemotePattern[]} */
  const remotePatterns = [];

  if (SUPABASE_URL) {
    const hostname = new URL(SUPABASE_URL).hostname;

    remotePatterns.push({
      protocol: "https",
      hostname,
    });
  }

  if (!IS_PRODUCTION) {
    remotePatterns.push({
      protocol: "http",
      hostname: "127.0.0.1",
    });

    remotePatterns.push({
      protocol: "http",
      hostname: "localhost",
    });
  }

  return remotePatterns;
};

const getLocalPatterns = () => {
  const localPatterns = [
    {
      pathname: "/assets/**",
    },
  ];

  return localPatterns;
};

const transpilePackages = ["@repo/api", "@repo/db", "@repo/ui", ...getContentPackages()];

/** @type {import("next").NextConfig} */
const config = {
  /** next dev rewrites AGENTS.md/CLAUDE.md when it detects an agent; we own those files */
  agentRules: false,
  cacheComponents: true,
  experimental: {
    /**
     * Reuse client-cached page segments for dynamic routes (the filterable
     * home grid reads searchParams) so navigating back doesn't refetch and
     * re-show loading skeletons. Content only changes on deploy, so briefly
     * stale segments are harmless.
     */
    staleTimes: {
      dynamic: 180,
    },
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
  headers: async () => [
    {
      source: "/((?!_next/|_vercel/).*)",
      headers: [{ key: "Vary", value: "Accept" }],
    },
  ],
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages,
  images: {
    remotePatterns: getRemotePatterns(),
    localPatterns: getLocalPatterns(),
  },
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
};

export default config;
