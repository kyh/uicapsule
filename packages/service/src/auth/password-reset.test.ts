import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { APIError } from "better-auth/api";

// Node runs test files in isolated processes; this exercises our unconfigured auth options.
delete process.env.RESEND_API_KEY;
delete process.env.AUTH_EMAIL_FROM;
const { auth } = await import("./auth");
const options = {
  ...auth.options,
  logger: { disabled: true },
  rateLimit: { enabled: false },
  secret: "uicapsule-password-reset-integration-test-secret",
};

test("password reset changes credentials, consumes its token, and revokes existing sessions", async () => {
  let delivery: { email: string; url: string; token: string } | undefined;
  const testAuth = betterAuth({
    ...options,
    database: memoryAdapter({ account: [], session: [], user: [], verification: [] }),
    emailAndPassword: {
      ...options.emailAndPassword,
      sendResetPassword: ({ user, url, token }) => {
        delivery = { email: user.email, token, url };
        return Promise.resolve();
      },
    },
  });
  const email = "reset@example.com";
  const oldPassword = "old-password-for-reset";
  const newPassword = "new-password-after-reset";
  const signup = await testAuth.api.signUpEmail({
    asResponse: true,
    body: { email, name: "Reset Test", password: oldPassword },
  });
  assert.equal(signup.status, 200);
  const headers = new Headers({
    cookie: signup.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  });
  const session = await testAuth.api.getSession({ headers });
  assert.equal(session?.user.email, email);

  await testAuth.api.requestPasswordReset({
    body: { email, redirectTo: "/auth/password-update" },
  });
  assert.ok(delivery);
  assert.equal(delivery.email, email);
  const callback = await testAuth.handler(new Request(delivery.url));
  assert.equal(callback.status, 302);
  const location = callback.headers.get("location");
  assert.ok(location);
  const resetPage = new URL(location);
  assert.equal(resetPage.pathname, "/auth/password-update");
  assert.equal(resetPage.searchParams.get("token"), delivery.token);

  await testAuth.api.resetPassword({ body: { newPassword, token: delivery.token } });
  assert.equal(await testAuth.api.getSession({ headers }), null);
  await assert.rejects(
    testAuth.api.signInEmail({ body: { email, password: oldPassword } }),
    (error) => error instanceof APIError && error.body?.code === "INVALID_EMAIL_OR_PASSWORD",
  );
  const signin = await testAuth.api.signInEmail({ body: { email, password: newPassword } });
  assert.equal(signin.user.email, email);
  await assert.rejects(
    testAuth.api.resetPassword({ body: { newPassword: oldPassword, token: delivery.token } }),
    (error) => error instanceof APIError && error.body?.code === "INVALID_TOKEN",
  );
});

test("missing email configuration disables password reset before user lookup", async () => {
  const testAuth = betterAuth({ ...options, database: memoryAdapter({}) });
  await assert.rejects(
    testAuth.api.requestPasswordReset({ body: { email: "unknown@example.com" } }),
    (error) => error instanceof APIError && error.body?.code === "RESET_PASSWORD_DISABLED",
  );
});
