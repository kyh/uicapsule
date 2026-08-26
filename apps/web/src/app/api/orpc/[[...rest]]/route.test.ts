import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import * as route from "./route";

/**
 * This endpoint's cross-site defense is a set of things typecheck cannot see:
 * the session cookie's SameSite=Lax, the handler refusing GET, and the origin
 * check covering what SameSite does not — a same-site *cross-origin* POST.
 * Driving the real exported handlers pins the last two, along with the absence
 * of CORS headers, each of which would otherwise regress silently.
 *
 * No database is needed: better-auth resolves a cookie-less request to a null
 * session without a query, and the one request that gets through stops at
 * `protectedProcedure`'s session check.
 */

const APP_ORIGIN = "http://localhost:3000";

const post = (headers: Record<string, string> = {}) =>
  route.POST(
    new NextRequest(`${APP_ORIGIN}/api/orpc/user/me`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ json: {} }),
    }),
  );

describe("rpc endpoint", () => {
  // `SameSite` keys on site, not origin, so another port on localhost — or a
  // sibling subdomain in production — is same-site and the browser attaches the
  // session cookie to a form POST from it.
  test("refuses a POST whose Origin is another origin, even a same-site one", async () => {
    const response = await post({ origin: "http://localhost:3398" });
    assert.strictEqual(response.status, 403);
  });

  test("allows a POST whose Origin is the app itself", async () => {
    const response = await post({ origin: APP_ORIGIN });
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  // A non-browser caller sends no Origin and authenticates by an explicit
  // header, so there is no ambient cookie for another page to forge a call with.
  test("allows a POST with no Origin at all", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("refuses GET, so a cross-site navigation cannot invoke a procedure", async () => {
    // Unmatched rather than rejected: `allowMethods` leaves GET off the list, so
    // the handler never resolves a procedure and the route 404s.
    const response = await route.GET(
      new NextRequest(`${APP_ORIGIN}/api/orpc/user/me`, { method: "GET" }),
    );
    assert.strictEqual(response.status, 404);
  });

  test("serves no CORS headers, so a credentialed cross-origin fetch cannot read it", async () => {
    const response = await post();
    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });

  test("exports no OPTIONS handler", () => {
    assert.ok(!("OPTIONS" in route));
  });
});
