import assert from "node:assert/strict";
import { test } from "node:test";

import { auth } from "./auth";

test("session cookie is SameSite Lax or Strict, never None", async () => {
  const { authCookies } = await auth.$context;
  const sameSite = String(authCookies.sessionToken.attributes.sameSite).toLowerCase();

  assert.ok(
    sameSite === "lax" || sameSite === "strict",
    `session cookie sameSite must be lax or strict, got ${sameSite}`,
  );
});
