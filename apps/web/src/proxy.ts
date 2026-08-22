import { NextResponse } from "next/server";

import {
  MARKDOWN_CONTENT_TYPE,
  negotiateMediaType,
  notAcceptableBody,
  withVaryAccept,
} from "@/lib/agent/accept";

import type { NextRequest } from "next/server";

/**
 * Markdown content negotiation, to the acceptmarkdown.com contract:
 * one URL, two representations, `Vary: Accept` on both.
 * <https://acceptmarkdown.com/recipes/nextjs>
 *
 * Server Components render HTML unconditionally, so the proxy is the only place
 * this can happen — it rewrites Markdown-preferring requests to
 * `/api/markdown/*` before the page renders.
 */

const MARKDOWN_ROUTE_PREFIX = "/api/markdown";

const markdownRewrite = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = `${MARKDOWN_ROUTE_PREFIX}${pathname}`;
  return NextResponse.rewrite(url);
};

/** `Vary: Accept` has to survive alongside Next's RSC vary tokens, not replace them. */
const applyVary = (response: NextResponse): NextResponse => {
  response.headers.set("Vary", withVaryAccept(response.headers.get("Vary")));
  return response;
};

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // An explicit `.md` URL is Markdown regardless of Accept: it is what the
  // `Link: rel="alternate"` header points at, and a crawler following that link
  // may send no Accept header at all.
  if (pathname.endsWith(".md")) {
    const stripped = pathname.slice(0, -".md".length);
    return applyVary(markdownRewrite(request, stripped === "/index" ? "" : stripped));
  }

  const accept = request.headers.get("accept");
  const chosen = negotiateMediaType(accept);

  if (chosen === "text/markdown") {
    return applyVary(markdownRewrite(request, pathname === "/" ? "" : pathname));
  }

  // Nothing this site produces is acceptable to the client — the only case
  // RFC 9110 wants a 406 for. A missing or wildcard Accept never lands here.
  if (chosen === null) {
    return new Response(notAcceptableBody(accept), {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
        "Cache-Control": "no-store",
      },
    });
  }

  const response = applyVary(NextResponse.next());
  response.headers.set(
    "Link",
    `<${request.nextUrl.origin}${pathname === "/" ? "/index" : pathname}.md>; rel="alternate"; type="${MARKDOWN_CONTENT_TYPE}"`,
  );
  return response;
};

export const config = {
  /**
   * Everything except Next internals, the JSON contracts (`/r/*`, `/api/*`),
   * the bare preview frames, and files that already have exactly one
   * representation (`robots.txt`, `sitemap.xml`, `llms.txt`, static assets).
   */
  matcher: [
    "/((?!api/|_next/|_vercel/|r/|preview-frame/|favicon/|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|og\\.jpg$).*)",
  ],
};
