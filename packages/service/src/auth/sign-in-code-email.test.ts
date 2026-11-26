import assert from "node:assert/strict";
import { test } from "node:test";
import { APIError } from "better-auth/api";

import {
  SIGN_IN_CODE_OFF_WARNING,
  sendSignInCodeEmail,
  signInCodeModeOf,
  signInCodeSenderOf,
} from "./sign-in-code-email";

const SENDER = "UICapsule <hello@example.com>";

test("sign-in codes send once Resend and a sender are set, and otherwise log outside production only", () => {
  for (const production of [false, true]) {
    assert.equal(
      signInCodeModeOf({ AUTH_EMAIL_FROM: SENDER, RESEND_API_KEY: "test-key" }, production),
      "resend",
    );
  }

  for (const settings of [{}, { RESEND_API_KEY: "test-key" }, { AUTH_EMAIL_FROM: SENDER }]) {
    assert.equal(signInCodeModeOf(settings, false), "log");
    assert.equal(signInCodeModeOf(settings, true), "off");
  }

  assert.match(SIGN_IN_CODE_OFF_WARNING, /AUTH_EMAIL_FROM/u);
});

test("the development sender logs the code instead of calling Resend", async (t) => {
  const info = t.mock.method(console, "info");

  await signInCodeSenderOf("log")({ email: "dev@example.com", otp: "482913", type: "sign-in" });
  const logged = JSON.stringify(info.mock.calls);
  assert.ok(logged.includes("dev@example.com"));
  assert.ok(logged.includes("482913"));
});

test("the sender sends sign-in codes only", async (t) => {
  const info = t.mock.method(console, "info");

  await Promise.all(
    (["email-verification", "forget-password", "change-email"] as const).map(async (type) => {
      await signInCodeSenderOf("log")({ email: "dev@example.com", otp: "482913", type });
    }),
  );

  assert.equal(info.mock.callCount(), 0);
});

test("without email configuration, production refuses to send a code", async () => {
  await assert.rejects(
    signInCodeSenderOf("off")({ email: "dev@example.com", otp: "482913", type: "sign-in" }),
    (error) => error instanceof APIError && error.body?.code === "EMAIL_DISABLED",
  );
});

test("code delivery reports provider and network failures", async (t) => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousSender = process.env.AUTH_EMAIL_FROM;
  process.env.RESEND_API_KEY = "test-key";
  process.env.AUTH_EMAIL_FROM = SENDER;
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

  let received: Request | undefined;
  await sendSignInCodeEmail("dev@example.com", "482913", async (input, init) => {
    received = new Request(input, init);

    return await Promise.resolve(Response.json({ id: "test-message" }));
  });
  assert.ok(received);
  assert.equal(received.url, "https://api.resend.com/emails");
  assert.equal(received.method, "POST");
  assert.equal(received.headers.get("authorization"), "Bearer test-key");
  const message: unknown = await received.json();
  assert.deepEqual(message, {
    from: SENDER,
    subject: "Your UICapsule sign-in code",
    text: "Your UICapsule sign-in code is 482913.\n\nIt expires in 5 minutes. If you didn't ask for it, ignore this email.",
    to: ["dev@example.com"],
  });

  await assert.rejects(
    sendSignInCodeEmail(
      "dev@example.com",
      "482913",
      async () => await Promise.resolve(new Response(null, { status: 503 })),
    ),
    APIError,
  );
  await assert.rejects(
    sendSignInCodeEmail(
      "dev@example.com",
      "482913",
      async () => await Promise.reject(new Error("Network unavailable")),
    ),
    APIError,
  );
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendSignInCodeEmail("dev@example.com", "482913"), APIError);
});
