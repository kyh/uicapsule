import { NextResponse } from "next/server";

import { negotiateMediaType, notAcceptableBody, withVaryAccept } from "@/lib/agent/accept";

import type { NextRequest } from "next/server";

const MARKDOWN_ROUTE_PREFIX = "/api/markdown";

const RSC_MEDIA_TYPE = "text/x-component";

const markdownRewrite = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = `${MARKDOWN_ROUTE_PREFIX}${pathname}`;

  return NextResponse.rewrite(url);
};

const applyVary = (response: NextResponse) => {
  response.headers.set("Vary", withVaryAccept(response.headers.get("Vary")));

  return response;
};

const isFlightRequest = (request: NextRequest) =>
  (request.headers.get("accept") ?? "").toLowerCase().includes(RSC_MEDIA_TYPE) ||
  request.headers.has("next-action");

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (isFlightRequest(request)) {
    return applyVary(NextResponse.next());
  }

  if (pathname.endsWith(".md")) {
    const stripped = pathname.slice(0, -".md".length);

    return applyVary(markdownRewrite(request, stripped === "/index" ? "" : stripped));
  }

  const accept = request.headers.get("accept");
  const chosen = negotiateMediaType(accept);

  if (chosen === "text/markdown") {
    return applyVary(markdownRewrite(request, pathname === "/" ? "" : pathname));
  }

  if (chosen === null) {
    return new Response(notAcceptableBody(accept), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
      status: 406,
    });
  }

  return applyVary(NextResponse.next());
};

/**
 * Only a request that can negotiate to Markdown invokes the proxy: a `.md` URL,
 * or an `Accept` that names markdown. Plain HTML views never pay for an
 * invocation. The cost is that an `Accept` naming neither representation (say
 * `application/pdf`) gets HTML instead of 406 — RFC 9110 §12.5.1 lets a server
 * disregard Accept and send its default. Any Accept that mentions markdown but
 * accepts nothing (`text/markdown;q=0`) still gets the 406.
 *
 * Next compiles a `has` value to an anchored, case-sensitive RegExp, and Vercel
 * to its own route regex, so case-insensitivity is spelled out per character
 * rather than with an inline flag neither engine is guaranteed to support.
 *
 * Both exclude Next internals, the JSON contracts (`/r/*`, `/api/*`) and the
 * bare preview frames; the Accept entry also skips files that have exactly one
 * representation.
 */
export const config = {
  matcher: [
    { source: "/((?!api/|_next/|_vercel/|r/|preview-frame/|favicon/).*\\.md)" },
    {
      has: [{ key: "accept", type: "header", value: ".*[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" }],
      source:
        "/((?!api/|_next/|_vercel/|r/|preview-frame/|favicon/|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|og\\.jpg$).*)",
    },
  ],
};
