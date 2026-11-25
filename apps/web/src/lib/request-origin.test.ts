import assert from "node:assert/strict";
import { test } from "node:test";

import { isAllowedOrigin } from "./request-origin";

const EXTENSION = "chrome-extension://gndnanbepebpjjifhogmdlabbpddfgml";

const from = (origin?: string) =>
  new Request("http://localhost:3000/api/orpc/request/create", {
    headers: origin === undefined ? {} : { origin },
    method: "POST",
  });

test("allows no Origin and the app's own origin", () => {
  assert.ok(isAllowedOrigin(from(), ""));
  assert.ok(isAllowedOrigin(from("http://localhost:3000"), ""));
});

test("refuses another origin, even a same-site one", () => {
  assert.ok(!isAllowedOrigin(from("http://localhost:3398"), ""));
});

test("allows only the extension origins listed, matched exactly", () => {
  const listed = ` ${EXTENSION} , chrome-extension://another `;

  assert.ok(isAllowedOrigin(from(EXTENSION), listed));
  assert.ok(!isAllowedOrigin(from(EXTENSION), ""));
  assert.ok(!isAllowedOrigin(from(EXTENSION), undefined));
  assert.ok(!isAllowedOrigin(from("chrome-extension://gndnanbe"), listed));
});
