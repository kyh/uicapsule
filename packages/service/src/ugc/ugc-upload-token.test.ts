import assert from "node:assert/strict";
import { test } from "node:test";

import { signUploadGrant, verifyUploadGrant } from "./ugc-upload-token";

const grant = {
  contentType: "text/javascript",
  expiresAt: 2000,
  pathname: "ugc/u1/knob/0123456789abcdef/index.js",
  size: 10,
};

test("a signed grant verifies until it expires", () => {
  const token = signUploadGrant(grant, "secret");

  assert.deepEqual(verifyUploadGrant(token, "secret", 1000), grant);
  assert.equal(verifyUploadGrant(token, "secret", 2000), null);
});

test("a grant signed with another secret, or edited, is refused", () => {
  const token = signUploadGrant(grant, "secret");
  const [, signature] = token.split(".");
  const edited = Buffer.from(JSON.stringify({ ...grant, size: 10_000_000 })).toString("base64url");

  assert.equal(verifyUploadGrant(token, "other", 1000), null);
  assert.equal(verifyUploadGrant(`${edited}.${signature}`, "secret", 1000), null);
  assert.equal(verifyUploadGrant(`${token}.x`, "secret", 1000), null);
  assert.equal(verifyUploadGrant("garbage", "secret", 1000), null);
});
