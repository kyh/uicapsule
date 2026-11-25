const parseOrigins = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

/**
 * Whether a POST may reach a procedure: no Origin (not a browser), the app's own origin, or a
 * browser-extension origin listed in `EXTENSION_ORIGINS`.
 */
export const isAllowedOrigin = (
  request: Request,
  extensionOrigins: string | undefined = process.env.EXTENSION_ORIGINS,
) => {
  const origin = request.headers.get("origin");

  if (origin === null || origin === new URL(request.url).origin) {
    return true;
  }

  return parseOrigins(extensionOrigins).includes(origin);
};
