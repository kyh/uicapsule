import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import * as route from "./route";

// Cookie-less requests stop at the session guard without querying the database.
const APP_ORIGIN = "http://localhost:3000";

const post = (headers: Record<string, string> = {}) =>
  route.POST(
    new NextRequest(`${APP_ORIGIN}/api/orpc/user/me`, {
      body: JSON.stringify({ json: {} }),
      headers: { "content-type": "application/json", ...headers },
      method: "POST",
    }),
  );

describe("rpc endpoint", () => {
  test("refuses a POST whose Origin is another origin, even a same-site one", async () => {
    const response = await post({ origin: "http://localhost:3398" });
    assert.strictEqual(response.status, 403);
  });

  test("allows a POST whose Origin is the app itself", async () => {
    const response = await post({ origin: APP_ORIGIN });
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/u);
  });

  test("allows a POST with no Origin at all", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/u);
  });

  test("refuses GET, so a cross-site navigation cannot invoke a procedure", async () => {
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
