import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { APIError } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";

delete process.env.RESEND_API_KEY;

delete process.env.AUTH_EMAIL_FROM;

const { auth } = await import("./auth");

const { guardSignInCodes } = await import("./sign-in-code-email");

const options = {
  ...auth.options,
  logger: { disabled: true },
  plugins: auth.options.plugins.filter((plugin) => plugin.id === "email-otp"),
  rateLimit: { enabled: false },
  secret: "uicapsule-sign-in-code-integration-test-secret",
};

const authCapturingCodes = () => {
  const codes: { email: string; otp: string }[] = [];

  const testAuth = betterAuth({
    ...options,
    database: memoryAdapter({ account: [], session: [], user: [], verification: [] }),
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp }) => {
          codes.push({ email, otp });

          await Promise.resolve();
        },
      }),
    ],
  });

  return { codes, testAuth };
};

test("an emailed code signs a new address up, then signs it in again", async () => {
  const { codes, testAuth } = authCapturingCodes();
  const email = "code@example.com";

  await testAuth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const [first] = codes;
  assert.ok(first);
  assert.equal(first.email, email);

  const signup = await testAuth.api.signInEmailOTP({
    asResponse: true,
    body: { email, name: "Code Test", otp: first.otp },
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
  assert.equal(session.user.emailVerified, true);

  await assert.rejects(
    testAuth.api.signInEmailOTP({ body: { email, otp: first.otp } }),
    (error) => error instanceof APIError && error.body?.code === "INVALID_OTP",
  );

  await testAuth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const second = codes.at(-1);
  assert.ok(second);
  const signin = await testAuth.api.signInEmailOTP({ body: { email, otp: second.otp } });
  assert.equal(signin.user.id, session.user.id);
});

test("a wrong code does not sign in", async () => {
  const { codes, testAuth } = authCapturingCodes();
  const email = "wrong@example.com";

  await testAuth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const wrong = codes[0]?.otp === "000000" ? "111111" : "000000";

  await assert.rejects(
    testAuth.api.signInEmailOTP({ body: { email, otp: wrong } }),
    (error) => error instanceof APIError && error.body?.code === "INVALID_OTP",
  );
});

test("without email configuration, development logs the code", async (t) => {
  const info = t.mock.method(console, "info");

  const testAuth = betterAuth({
    ...options,
    database: memoryAdapter({ account: [], session: [], user: [], verification: [] }),
  });

  await testAuth.api.sendVerificationOTP({
    body: { email: "logged@example.com", type: "sign-in" },
  });
  const logged = JSON.stringify(info.mock.calls);
  assert.ok(logged.includes("logged@example.com"));
  assert.match(logged, /sign-in code is \d{6}/u);
});

test("a deployment that sends no email refuses to send a code", async () => {
  const testAuth = betterAuth({
    ...options,
    database: memoryAdapter({ account: [], session: [], user: [], verification: [] }),
    hooks: { before: guardSignInCodes("off") },
  });

  await assert.rejects(
    testAuth.api.sendVerificationOTP({ body: { email: "off@example.com", type: "sign-in" } }),
    (error) => error instanceof APIError && error.body?.code === "EMAIL_DISABLED",
  );
});

test("a code's sign-in from another site is refused, and from this one goes through", async () => {
  const { codes, testAuth } = authCapturingCodes();
  const email = "origin@example.com";

  const signInFrom = async (origin: string, otp: string) =>
    await testAuth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email-otp", {
        body: JSON.stringify({ email, otp }),
        headers: { "content-type": "application/json", origin },
        method: "POST",
      }),
    );

  await testAuth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const [sent] = codes;
  assert.ok(sent);

  const foreign = await signInFrom("https://attacker.example", sent.otp);
  assert.equal(foreign.status, 403);

  const own = await signInFrom("http://localhost:3000", sent.otp);
  assert.equal(own.status, 200);
});
