import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { auth } from "./auth";

/**
 * SameSite is the cross-SITE half of the defense for `/api/orpc`: oRPC ships no
 * CSRF token, and the route sets no CORS headers, so a forged cross-site POST
 * is harmless only while the browser refuses to attach this cookie to it. The
 * other half — a same-site *cross-origin* POST, which SameSite does attach the
 * cookie to — is the route's own Origin check, pinned in its `route.test.ts`.
 * Nothing else in the gate can catch a regression here: typecheck and build are
 * happy with any valid value, and loosening it to `"none"` re-opens cross-site
 * CSRF silently. Nothing in `auth.ts` sets `advanced.defaultCookieAttributes`,
 * so the safe value rests entirely on a better-auth default this pins.
 *
 * Read the *resolved* attributes rather than the config literal: a plugin, a
 * `crossSubDomainCookies` option, or a better-auth default can decide this too,
 * and asserting the literal against itself would prove nothing.
 */
describe("session cookie", () => {
  test("is SameSite Lax or Strict, never None", async () => {
    const { authCookies } = await auth.$context;
    const sameSite = String(authCookies.sessionToken.attributes.sameSite).toLowerCase();

    assert.ok(
      sameSite === "lax" || sameSite === "strict",
      `session cookie sameSite must be lax or strict, got ${sameSite}`,
    );
  });
});
