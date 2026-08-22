import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the agent-facing surfaces (Accept negotiation, Markdown,
 * llms.txt, sitemap, JSON-LD). Everything under `src/lib/agent` is deliberately
 * pure so it can be exercised here without a Next runtime — the route handlers
 * and `src/proxy.ts` only wire data into these functions.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
