import { APIError } from "better-auth/api";

type PasswordResetMode = "resend" | "log" | "off";

interface PasswordResetRequest {
  user: { email: string };
  url: string;
}

const resetText = (url: string) =>
  `Reset your password using this link:\n\n${url}\n\nThis link expires in one hour. If you didn't request it, ignore this email.`;

interface PasswordResetSettings {
  readonly AUTH_EMAIL_FROM?: string | undefined;
  readonly RESEND_API_KEY?: string | undefined;
}

export const passwordResetModeOf = (
  { AUTH_EMAIL_FROM, RESEND_API_KEY }: PasswordResetSettings,
  production: boolean,
) => {
  if (
    RESEND_API_KEY !== undefined &&
    RESEND_API_KEY !== "" &&
    AUTH_EMAIL_FROM !== undefined &&
    AUTH_EMAIL_FROM !== ""
  ) {
    return "resend" satisfies PasswordResetMode;
  }

  return (production ? "off" : "log") satisfies PasswordResetMode;
};

export const PASSWORD_RESET_OFF_WARNING =
  "This deployment sends no email (RESEND_API_KEY or AUTH_EMAIL_FROM is unset): password reset is refused.";

const logPasswordResetEmail = (to: string, url: string) => {
  console.info(
    `[password-reset] RESEND_API_KEY or AUTH_EMAIL_FROM not set — logging instead of sending\nto: ${to}\n${resetText(url)}`,
  );
};

export const sendPasswordResetEmail = async (
  to: string,
  url: string,
  send: typeof fetch = fetch,
) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (apiKey === undefined || apiKey === "" || from === undefined || from === "") {
    throw APIError.from("SERVICE_UNAVAILABLE", {
      code: "PASSWORD_RESET_UNAVAILABLE",
      message: "Password reset is temporarily unavailable. Try again later.",
    });
  }

  try {
    const response = await send("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        subject: "Reset your UICapsule password",
        text: resetText(url),
        to: [to],
      }),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      return;
    }

    console.error("Password reset email failed", response.status, await response.text());
  } catch (error) {
    console.error("Password reset email failed", error);
  }

  throw APIError.from("SERVICE_UNAVAILABLE", {
    code: "PASSWORD_RESET_DELIVERY_FAILED",
    message: "Unable to send a password reset email. Try again later.",
  });
};

const deliverPasswordReset = async (
  mode: "log" | "resend",
  { user, url }: PasswordResetRequest,
) => {
  if (mode === "log") {
    logPasswordResetEmail(user.email, url);

    return;
  }

  await sendPasswordResetEmail(user.email, url);
};

export const passwordResetSenderOf = (mode: PasswordResetMode) =>
  mode === "off"
    ? undefined
    : async (request: PasswordResetRequest) => {
        await deliverPasswordReset(mode, request);
      };
