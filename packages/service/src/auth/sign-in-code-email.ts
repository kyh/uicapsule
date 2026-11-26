import { APIError, createAuthMiddleware, formCsrfMiddleware } from "better-auth/api";

type SignInCodeMode = "resend" | "log" | "off";

type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

interface SignInCodeRequest {
  email: string;
  otp: string;
  type: OtpType;
}

const codeText = (otp: string) =>
  `Your UICapsule sign-in code is ${otp}.\n\nIt expires in 5 minutes. If you didn't ask for it, ignore this email.`;

interface SignInCodeSettings {
  readonly AUTH_EMAIL_FROM?: string | undefined;
  readonly RESEND_API_KEY?: string | undefined;
}

export const signInCodeModeOf = (
  { AUTH_EMAIL_FROM, RESEND_API_KEY }: SignInCodeSettings,
  production: boolean,
) => {
  if (
    RESEND_API_KEY !== undefined &&
    RESEND_API_KEY !== "" &&
    AUTH_EMAIL_FROM !== undefined &&
    AUTH_EMAIL_FROM !== ""
  ) {
    return "resend" satisfies SignInCodeMode;
  }

  return (production ? "off" : "log") satisfies SignInCodeMode;
};

export const SIGN_IN_CODE_OFF_WARNING =
  "This deployment sends no email (RESEND_API_KEY or AUTH_EMAIL_FROM is unset): sign-in by email code is refused.";

const logSignInCodeEmail = (to: string, otp: string) => {
  console.info(
    `[sign-in-code] RESEND_API_KEY or AUTH_EMAIL_FROM not set — logging instead of sending\nto: ${to}\n${codeText(otp)}`,
  );
};

export const sendSignInCodeEmail = async (to: string, otp: string, send: typeof fetch = fetch) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (apiKey === undefined || apiKey === "" || from === undefined || from === "") {
    throw APIError.from("SERVICE_UNAVAILABLE", {
      code: "EMAIL_DISABLED",
      message: "Sign-in by email is unavailable: this site sends no email.",
    });
  }

  try {
    const response = await send("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        subject: "Your UICapsule sign-in code",
        text: codeText(otp),
        to: [to],
      }),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      return;
    }

    console.error("Sign-in code email failed", response.status, await response.text());
  } catch (error) {
    console.error("Sign-in code email failed", error);
  }

  throw APIError.from("SERVICE_UNAVAILABLE", {
    code: "SIGN_IN_CODE_DELIVERY_FAILED",
    message: "Unable to send a sign-in code. Try again later.",
  });
};

/** The `emailOTP` sender: sends sign-in codes only; `guardSignInCodes` stops them first when the deployment sends no email. */
export const signInCodeSenderOf =
  (mode: SignInCodeMode) =>
  async ({ email, otp, type }: SignInCodeRequest) => {
    if (type !== "sign-in") {
      return;
    }

    if (mode === "off") {
      return;
    }

    if (mode === "log") {
      logSignInCodeEmail(email, otp);

      return;
    }

    await sendSignInCodeEmail(email, otp);
  };

/**
 * The auth hook for sign-in codes: a code's sign-in checks the request's origin,
 * which better-auth checks only when a code is asked for, and a deployment that
 * sends no email refuses to send one, since better-auth answers success over a
 * sender that throws.
 */
export const guardSignInCodes = (mode: SignInCodeMode) =>
  createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/sign-in/email-otp") {
      await formCsrfMiddleware(ctx);
    }

    if (ctx.path === "/email-otp/send-verification-otp" && mode === "off") {
      throw APIError.from("SERVICE_UNAVAILABLE", {
        code: "EMAIL_DISABLED",
        message: "Sign-in by email is unavailable: this site sends no email.",
      });
    }
  });
