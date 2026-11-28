import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, test } from "node:test";
import { z } from "zod";

import { createAppJwt, githubNetworkPolicy } from "./github-app";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ format: "pem", type: "pkcs1" }).toString();

const claimsSchema = z.record(z.string(), z.union([z.string(), z.number()]));

const decode = (part: string) =>
  claimsSchema.parse(JSON.parse(Buffer.from(part, "base64url").toString()));

describe("createAppJwt", () => {
  test("signs an RS256 token the app's public key verifies", () => {
    const jwt = createAppJwt({ appId: "123", now: new Date(1_000_000_000), privateKey: pem });
    const [header = "", payload = "", signature = ""] = jwt.split(".");

    assert.deepEqual(decode(header), { alg: "RS256", typ: "JWT" });
    assert.deepEqual(decode(payload), { exp: 1_000_540, iat: 999_940, iss: "123" });
    assert.equal(
      createVerify("RSA-SHA256")
        .update(`${header}.${payload}`)
        .verify(publicKey, signature, "base64url"),
      true,
    );
  });

  test("accepts a key whose newlines were stored escaped", () => {
    const escaped = pem.replaceAll("\n", String.raw`\n`);

    assert.equal(
      createAppJwt({ appId: "1", now: new Date(0), privateKey: escaped }),
      createAppJwt({ appId: "1", now: new Date(0), privateKey: pem }),
    );
  });
});

describe("githubNetworkPolicy", () => {
  test("adds the token for git and the API and lets other hosts through untouched", () => {
    const policy = githubNetworkPolicy("t0k");
    const basic = `Basic ${Buffer.from("x-access-token:t0k").toString("base64")}`;

    assert.deepEqual(policy.allow["*"], []);
    assert.deepEqual(policy.allow["github.com"], [
      { transform: [{ headers: { authorization: basic } }] },
    ]);
    assert.deepEqual(policy.allow["api.github.com"], [
      { transform: [{ headers: { authorization: "Bearer t0k" } }] },
    ]);
  });
});
