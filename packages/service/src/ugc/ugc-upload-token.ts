import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const grantSchema = z.object({
  contentType: z.string(),
  expiresAt: z.int(),
  pathname: z.string(),
  size: z.int().min(0),
});

/** What one signed upload URL lets its holder write: one Blob key, of one type, up to one size. */
export type UploadGrant = z.infer<typeof grantSchema>;

const sign = (payload: string, secret: string) =>
  createHmac("sha256", `ugc-upload:${secret}`).update(payload).digest("base64url");

/** The token a signed upload URL carries: the grant, then its HMAC under the auth secret. */
export const signUploadGrant = (grant: UploadGrant, secret: string) => {
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
};

/** The grant a token carries, or null when it is forged, malformed or expired. */
export const verifyUploadGrant = (token: string, secret: string, now = Date.now()) => {
  const [payload, signature, ...rest] = token.split(".");

  if (!payload || !signature || rest.length > 0) {
    return null;
  }

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const grant = grantSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString()));

    return grant.success && grant.data.expiresAt > now ? grant.data : null;
  } catch {
    return null;
  }
};
