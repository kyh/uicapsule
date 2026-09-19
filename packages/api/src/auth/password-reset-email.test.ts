import assert from "node:assert/strict";
import { test } from "node:test";
import { APIError } from "better-auth/api";

import { sendPasswordResetEmail } from "./password-reset-email";

test("password reset delivery reports provider and network failures", async (t) => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousSender = process.env.AUTH_EMAIL_FROM;
  process.env.RESEND_API_KEY = "test-key";
  process.env.AUTH_EMAIL_FROM = "UICapsule <reset@example.com>";
  t.after(() => {
    if (previousKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousKey;
    }
    if (previousSender === undefined) {
      delete process.env.AUTH_EMAIL_FROM;
    } else {
      process.env.AUTH_EMAIL_FROM = previousSender;
    }
  });

  const resetUrl = "https://example.com/api/auth/reset-password/test-token";
  let received: Request | undefined;
  await sendPasswordResetEmail("dev@example.com", resetUrl, (input, init) => {
    received = new Request(input, init);
    return Promise.resolve(Response.json({ id: "test-message" }));
  });
  assert.ok(received);
  assert.equal(received.url, "https://api.resend.com/emails");
  assert.equal(received.method, "POST");
  assert.equal(received.headers.get("authorization"), "Bearer test-key");
  const message: unknown = await received.json();
  assert.deepEqual(message, {
    from: "UICapsule <reset@example.com>",
    subject: "Reset your UICapsule password",
    text: `Reset your password using this link:\n\n${resetUrl}\n\nThis link expires in one hour. If you didn't request it, ignore this email.`,
    to: ["dev@example.com"],
  });

  await assert.rejects(
    sendPasswordResetEmail("dev@example.com", resetUrl, () =>
      Promise.resolve(new Response(null, { status: 503 })),
    ),
    APIError,
  );
  await assert.rejects(
    sendPasswordResetEmail("dev@example.com", resetUrl, () =>
      Promise.reject(new Error("Network unavailable")),
    ),
    APIError,
  );
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendPasswordResetEmail("dev@example.com", resetUrl), APIError);
});
