import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

type ImageConfig = NonNullable<NextConfig["images"]>;
type RemotePatterns = NonNullable<ImageConfig["remotePatterns"]>;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

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

  if (SUPABASE_URL) {
    const { hostname } = new URL(SUPABASE_URL);

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
    // Avoid replaying grid skeletons on back navigation; content changes only on deploy.
    staleTimes: {
      dynamic: 180,
    },
  },
  images: {
    localPatterns: [{ pathname: "/assets/**" }],
    remotePatterns: getRemotePatterns(),
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages,
};

export default config;
