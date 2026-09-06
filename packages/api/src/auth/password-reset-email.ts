import { APIError } from "better-auth/api";

export const sendPasswordResetEmail = async (
  to: string,
  url: string,
  send: typeof fetch = fetch,
) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw APIError.from("SERVICE_UNAVAILABLE", {
      code: "PASSWORD_RESET_UNAVAILABLE",
      message: "Password reset is temporarily unavailable. Try again later.",
    });
  }

  try {
    const response = await send("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your UICapsule password",
        text: `Reset your password using this link:\n\n${url}\n\nThis link expires in one hour. If you didn't request it, ignore this email.`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return;
  } catch {
    // Better Auth logs delivery errors while keeping reset responses private.
  }
  throw APIError.from("SERVICE_UNAVAILABLE", {
    code: "PASSWORD_RESET_DELIVERY_FAILED",
    message: "Unable to send a password reset email. Try again later.",
  });
};
