#!/usr/bin/env tsx
/**
 * Runtime verification of the agent-facing surfaces against a running server.
 * `pnpm verify` is a static gate and cannot see any of this: response status
 * codes, `Content-Type`, `Vary`, whether the homepage HTML actually contains an
 * `<h1>` and its JSON-LD, or whether `Accept: text/markdown` negotiates.
 *
 *   pnpm dev:web                       # or: pnpm build && pnpm -F @repo/web start
 *   pnpm check:agent-endpoints         # defaults to http://localhost:3000
 *   pnpm check:agent-endpoints https://uicapsule.com
 *
 * Exits non-zero on the first failing expectation, listing every failure.
 */
import { consola } from "consola";

const baseUrl = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/u, "");

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

const checks: Check[] = [];

const record = (name: string, ok: boolean, detail: string) => {
  checks.push({ detail, name, ok });
};

const expect = (name: string, ok: boolean, detail: string) => record(name, ok, detail);

const fetchWith = async (path: string, accept?: string) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: accept ? { accept } : {},
    redirect: "manual",
  });
  return { body: await response.text(), response };
};

/** Text an agent sees with JavaScript disabled: markup, scripts and templates stripped. */
const visibleText = (html: string): string =>
  html
    .replaceAll(/<script[\s\S]*?<\/script>/giu, " ")
    .replaceAll(/<style[\s\S]*?<\/style>/giu, " ")
    .replaceAll(/<template[\s\S]*?<\/template>/giu, " ")
    .replaceAll(/<[^>]+>/gu, " ")
    .replaceAll(/&[a-z]+;|&#\d+;/giu, " ")
    .replaceAll(/\s+/gu, " ")
    .trim();

const checkHomePage = async () => {
  const { response, body } = await fetchWith("/");
  expect("GET / → 200", response.status === 200, `status ${response.status}`);

  const headings = body.match(/<h1[^>]*>(?<inner>[\s\S]*?)<\/h1>/giu) ?? [];
  expect("home has exactly one <h1>", headings.length === 1, `found ${headings.length}`);

  const text = visibleText(body);
  expect(
    "home has 500+ chars of text without JavaScript",
    text.length >= 500,
    `${text.length} chars`,
  );

  const efficiency = (text.length / body.length) * 100;
  expect(
    "home content efficiency ≥ 5%",
    efficiency >= 5,
    `${efficiency.toFixed(2)}% (${text.length} text chars in ${(body.length / 1024).toFixed(0)}KB)`,
  );

  const jsonLdBlocks =
    body.match(/<script[^>]+type="application\/ld\+json"[^>]*>(?<body>[\s\S]*?)<\/script>/giu) ??
    [];
  expect("home ships JSON-LD", jsonLdBlocks.length > 0, `${jsonLdBlocks.length} block(s)`);

  const types = jsonLdBlocks.flatMap((block) => {
    const json = block.replaceAll(/^<script[^>]*>/giu, "").replaceAll(/<\/script>$/giu, "");
    const parsed = JSON.parse(json.replaceAll("\\u003c", "<"));
    const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    return graph.map((node: { "@type"?: string }) => node["@type"]);
  });
  for (const required of ["Organization", "WebSite", "SoftwareApplication", "CollectionPage"]) {
    expect(`JSON-LD includes ${required}`, types.includes(required), types.join(", "));
  }

  const organizationBlock = jsonLdBlocks
    .map((block) =>
      JSON.parse(
        block
          .replaceAll(/^<script[^>]*>/giu, "")
          .replaceAll(/<\/script>$/giu, "")
          .replaceAll("\\u003c", "<"),
      ),
    )
    .flatMap((parsed) => (Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed]))
    .find((node: { "@type"?: string }) => node["@type"] === "Organization");
  expect(
    "Organization has a contactPoint with an email",
    Array.isArray(organizationBlock?.contactPoint) &&
      organizationBlock.contactPoint.every(
        (point: { email?: string; contactType?: string }) => point.email && point.contactType,
      ),
    JSON.stringify(organizationBlock?.contactPoint ?? null).slice(0, 120),
  );

  for (const signal of [
    { name: "canonical", pattern: /<link[^>]+rel="canonical"[^>]+>/iu },
    { name: "html lang", pattern: /<html[^>]+lang="/iu },
    { name: "og:image", pattern: /<meta[^>]+property="og:image"/iu },
    { name: "og:type", pattern: /<meta[^>]+property="og:type"/iu },
  ]) {
    expect(`home has ${signal.name}`, signal.pattern.test(body), "missing");
  }
};

const checkMarkdownNegotiation = async () => {
  for (const path of ["/", "/about", "/contact", "/privacy", "/ui/dynamic-island"]) {
    const { response, body } = await fetchWith(path, "text/markdown");
    const contentType = response.headers.get("content-type") ?? "";
    expect(
      `Accept: text/markdown on ${path} → markdown`,
      response.status === 200 && contentType.startsWith("text/markdown"),
      `status ${response.status}, content-type ${contentType}`,
    );
    expect(
      `Vary on the markdown ${path} response includes Accept`,
      (response.headers.get("vary") ?? "").toLowerCase().includes("accept"),
      response.headers.get("vary") ?? "(none)",
    );
    expect(`markdown ${path} starts with an H1`, body.startsWith("# "), body.slice(0, 40));
  }

  const { response: htmlResponse, body: htmlBody } = await fetchWith("/about", "text/html");
  expect(
    "Accept: text/html still returns HTML from the same URL",
    (htmlResponse.headers.get("content-type") ?? "").startsWith("text/html") &&
      htmlBody.includes("<html"),
    htmlResponse.headers.get("content-type") ?? "(none)",
  );

  const { response: mdSibling } = await fetchWith("/about.md");
  expect(
    "/about.md serves markdown with no Accept header",
    (mdSibling.headers.get("content-type") ?? "").startsWith("text/markdown"),
    mdSibling.headers.get("content-type") ?? "(none)",
  );

  // React's own transport must never be negotiated: a Server Action sends
  // `Accept: text/x-component`, which no representation of this site satisfies.
  for (const [name, headers] of [
    ["a client-side navigation", { rsc: "1" }],
    ["a prefetch", { "next-router-prefetch": "1", rsc: "1" }],
    ["a Server Action", { accept: "text/x-component", "next-action": "abc123" }],
  ] as const) {
    const response = await fetch(`${baseUrl}/about`, { headers, redirect: "manual" });
    expect(
      `${name} is not answered with 406`,
      response.status !== 406,
      `status ${response.status}`,
    );
  }

  const { response: rejected } = await fetchWith("/about", "text/html;q=0, text/markdown");
  expect(
    "q=0 on text/html selects markdown",
    (rejected.headers.get("content-type") ?? "").startsWith("text/markdown"),
    rejected.headers.get("content-type") ?? "(none)",
  );

  const { response: browserLike } = await fetchWith(
    "/about",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  );
  expect(
    "a browser's Accept header still gets HTML",
    (browserLike.headers.get("content-type") ?? "").startsWith("text/html"),
    browserLike.headers.get("content-type") ?? "(none)",
  );
};

/** The proxy's matcher admits only `.md` URLs and an `Accept` naming markdown. */
const checkProxyScope = async () => {
  for (const [path, target] of [
    ["/", "/index.md"],
    ["/about", "/about.md"],
  ] as const) {
    const { body } = await fetchWith(path);
    const alternate =
      body.match(/<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*>/iu)?.[0] ?? "";
    expect(
      `HTML ${path} advertises ${target} via <link rel="alternate">`,
      alternate.includes(`${target}"`),
      alternate || "(none)",
    );
  }

  const { response: mixedCase } = await fetchWith("/about", "Text/Markdown");
  expect(
    "Accept matching is case-insensitive",
    (mixedCase.headers.get("content-type") ?? "").startsWith("text/markdown"),
    mixedCase.headers.get("content-type") ?? "(none)",
  );

  const { response: notAcceptable } = await fetchWith("/about", "text/markdown;q=0");
  expect(
    "Accept: text/markdown;q=0 → 406",
    notAcceptable.status === 406,
    `status ${notAcceptable.status}`,
  );

  // An Accept naming neither representation never reaches the proxy, so it is
  // disregarded (RFC 9110 §12.5.1) and served HTML. A 406 here means the proxy
  // ran on a plain HTML request.
  const { response: disregarded } = await fetchWith("/about", "application/pdf");
  expect(
    "Accept: application/pdf skips the proxy and gets HTML",
    disregarded.status === 200 &&
      (disregarded.headers.get("content-type") ?? "").startsWith("text/html"),
    `status ${disregarded.status}, content-type ${disregarded.headers.get("content-type")}`,
  );
};

const checkNotFound = async () => {
  const { response, body } = await fetchWith("/definitely-not-a-real-path");
  expect("unknown path → HTTP 404", response.status === 404, `status ${response.status}`);
  for (const target of ["/llms.txt", "/sitemap.xml", "/about"]) {
    expect(`HTML 404 points at ${target}`, body.includes(target), "missing");
  }

  const { response: markdown, body: markdownBody } = await fetchWith(
    "/definitely-not-a-real-path",
    "text/markdown",
  );
  expect(
    "unknown path with Accept: text/markdown → 404",
    markdown.status === 404,
    `status ${markdown.status}`,
  );
  expect(
    "markdown 404 body is markdown pointing at the recovery surfaces",
    markdownBody.startsWith("# 404") &&
      markdownBody.includes("/llms.txt") &&
      markdownBody.includes("/sitemap.xml"),
    markdownBody.slice(0, 80),
  );
};

const checkMachineFiles = async () => {
  const { response: sitemap, body: sitemapBody } = await fetchWith("/sitemap.xml");
  expect("GET /sitemap.xml → 200 XML", sitemap.status === 200, `status ${sitemap.status}`);
  expect(
    "sitemap is a valid urlset with lastmod",
    sitemapBody.includes("<urlset") && sitemapBody.includes("<lastmod>"),
    sitemapBody.slice(0, 80),
  );
  const urlCount = (sitemapBody.match(/<loc>/gu) ?? []).length;
  expect("sitemap lists the whole site", urlCount > 30, `${urlCount} URLs`);

  const { response: robots, body: robotsBody } = await fetchWith("/robots.txt");
  expect(
    "robots.txt advertises the sitemap",
    robots.status === 200 && robotsBody.includes("/sitemap.xml"),
    robotsBody.trim().replaceAll("\n", " | "),
  );

  const { response: llms, body: llmsBody } = await fetchWith("/llms.txt");
  expect("GET /llms.txt → 200 markdown", llms.status === 200, `status ${llms.status}`);
  expect(
    "llms.txt has the llmstxt.org shape",
    llmsBody.startsWith("# UICapsule\n\n> "),
    llmsBody.slice(0, 60),
  );
  expect(
    "llms.txt names when to use the site",
    llmsBody.includes("**When to use this:**") && llmsBody.includes("How to call it:"),
    "missing when-to-use guidance",
  );

  const { response: registry } = await fetchWith("/r/registry.json");
  expect("GET /r/registry.json still 200", registry.status === 200, `status ${registry.status}`);
};

const checkTrustAnchors = async () => {
  for (const path of ["/about", "/contact", "/privacy"]) {
    const { response, body } = await fetchWith(path);
    const text = visibleText(body);
    expect(`${path} → 200`, response.status === 200, `status ${response.status}`);
    expect(`${path} has 500+ chars of content`, text.length >= 500, `${text.length} chars`);
    expect(
      `${path} has an <h1> and a canonical`,
      /<h1[^>]*>/iu.test(body) && /rel="canonical"/iu.test(body),
      "missing",
    );
  }
};

const main = async () => {
  consola.info(`Checking agent readiness of ${baseUrl}`);

  await checkHomePage();
  await checkMarkdownNegotiation();
  await checkProxyScope();
  await checkNotFound();
  await checkMachineFiles();
  await checkTrustAnchors();

  for (const check of checks) {
    // `detail` describes the failure, so only a failing check needs it printed.
    if (check.ok) {
      consola.success(check.name);
    } else {
      consola.error(`${check.name} — ${check.detail}`);
    }
  }

  const failures = checks.filter((check) => !check.ok);
  if (failures.length > 0) {
    consola.error(`${failures.length} of ${checks.length} checks failed.`);
    process.exit(1);
  }
  consola.success(`All ${checks.length} agent-readiness checks passed.`);
};

try {
  await main();
} catch (error) {
  consola.error(error);
  process.exit(1);
}
