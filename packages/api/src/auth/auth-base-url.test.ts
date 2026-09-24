import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveBaseUrl } from "./auth";

const withEnv = (t: { after: (fn: () => void) => void }, env: Record<string, string>) => {
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        Reflect.deleteProperty(process.env, key);
      } else {
        process.env[key] = value;
      }
    }
  });
};

test("preview deploys accept both the deployment URL and the branch alias", (t) => {
  withEnv(t, {
    VERCEL_BRANCH_URL: "uicapsule-git-feature-kyh.vercel.app",
    VERCEL_ENV: "preview",
    VERCEL_URL: "uicapsule-abc123-kyh.vercel.app",
  });
  assert.deepEqual(resolveBaseUrl(), {
    allowedHosts: ["uicapsule-abc123-kyh.vercel.app", "uicapsule-git-feature-kyh.vercel.app"],
    fallback: "https://uicapsule-abc123-kyh.vercel.app",
    protocol: "https",
  });
});

test("production falls back to the production host for unlisted aliases", (t) => {
  withEnv(t, { VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "uicapsule.com" });
  assert.deepEqual(resolveBaseUrl(), {
    allowedHosts: ["uicapsule.com"],
    fallback: "https://uicapsule.com",
    protocol: "https",
  });
});
