import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // @repo/db builds its libsql client at module scope and the constructor
    // rejects an empty URL, so importing anything that reaches it needs a
    // parseable one. Nothing connects until a query runs; these tests never do.
    env: {
      TURSO_DATABASE_URL: "http://127.0.0.1:8080",
    },
  },
});
