import assert from "node:assert/strict";
import { test } from "node:test";
import { APIError } from "better-auth/api";

import {
  PASSWORD_RESET_OFF_WARNING,
  passwordResetModeOf,
  passwordResetSenderOf,
  sendPasswordResetEmail,
} from "./password-reset-email";

const SENDER = "UICapsule <reset@example.com>";

test("password reset sends once Resend and a sender are set, and otherwise logs outside production only", () => {
  for (const production of [false, true]) {
    assert.equal(
      passwordResetModeOf({ AUTH_EMAIL_FROM: SENDER, RESEND_API_KEY: "test-key" }, production),
      "resend",
    );
  }

  for (const settings of [{}, { RESEND_API_KEY: "test-key" }, { AUTH_EMAIL_FROM: SENDER }]) {
    assert.equal(passwordResetModeOf(settings, false), "log");
    assert.equal(passwordResetModeOf(settings, true), "off");
  }

  assert.equal(passwordResetSenderOf("off"), undefined);
  assert.match(PASSWORD_RESET_OFF_WARNING, /AUTH_EMAIL_FROM/u);
});

test("the development sender logs the reset link instead of calling Resend", async (t) => {
  const info = t.mock.method(console, "info");
  const resetUrl = "http://localhost:3000/api/auth/reset-password/dev-token";

  await passwordResetSenderOf("log")?.({ url: resetUrl, user: { email: "dev@example.com" } });
  const logged = JSON.stringify(info.mock.calls);
  assert.ok(logged.includes("dev@example.com"));
  assert.ok(logged.includes(resetUrl));
});

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
  await sendPasswordResetEmail("dev@example.com", resetUrl, async (input, init) => {
    received = new Request(input, init);

    return await Promise.resolve(Response.json({ id: "test-message" }));
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
    sendPasswordResetEmail(
      "dev@example.com",
      resetUrl,
      async () => await Promise.resolve(new Response(null, { status: 503 })),
    ),
    APIError,
  );
  await assert.rejects(
    sendPasswordResetEmail(
      "dev@example.com",
      resetUrl,
      async () => await Promise.reject(new Error("Network unavailable")),
    ),
    APIError,
  );
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendPasswordResetEmail("dev@example.com", resetUrl), APIError);
});
