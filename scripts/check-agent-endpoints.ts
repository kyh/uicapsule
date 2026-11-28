#!/usr/bin/env tsx
import { consola } from "consola";
import { z } from "zod";

import { GALLERY_RESOURCE_URI, galleryResultSchema } from "../packages/mcp-app/src/gallery-schema";

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

const expect = (name: string, ok: boolean, detail: string) => {
  record(name, ok, detail);
};

const fetchWith = async (path: string, accept?: string) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: accept !== undefined && accept !== "" ? { accept } : {},
    redirect: "manual",
  });

  return { body: await response.text(), response };
};

const jsonLdNode = z.looseObject({
  "@type": z.string().optional(),
  contactPoint: z
    .array(z.looseObject({ contactType: z.string().optional(), email: z.string().optional() }))
    .optional(),
});

const jsonLdBlock = jsonLdNode.extend({ "@graph": z.array(jsonLdNode).optional() });

const jsonLdNodesOf = (block: string) => {
  const parsed = jsonLdBlock.parse(
    JSON.parse(
      block
        .replaceAll(/^<script[^>]*>/giu, "")
        .replaceAll(/<\/script>$/giu, "")
        .replaceAll("\\u003c", "<"),
    ),
  );

  return parsed["@graph"] ?? [parsed];
};

const visibleText = (html: string) =>
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

  const nodes = jsonLdBlocks.flatMap(jsonLdNodesOf);
  const types = nodes.map((node) => node["@type"]);

  for (const required of ["Organization", "WebSite", "SoftwareApplication", "CollectionPage"]) {
    expect(`JSON-LD includes ${required}`, types.includes(required), types.join(", "));
  }

  const organizationBlock = nodes.find((node) => node["@type"] === "Organization");

  expect(
    "Organization has a contactPoint with an email",
    organizationBlock?.contactPoint !== undefined &&
      organizationBlock.contactPoint.every(
        (point) =>
          point.email !== undefined &&
          point.email !== "" &&
          point.contactType !== undefined &&
          point.contactType !== "",
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
  const markdownPages = await Promise.all(
    ["/", "/about", "/contact", "/privacy", "/terms", "/ui/dynamic-island"].map(async (path) => ({
      path,
      ...(await fetchWith(path, "text/markdown")),
    })),
  );

  for (const { path, response, body } of markdownPages) {
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

  const mdSiblings = await Promise.all(
    ["/about.md", "/privacy.md", "/terms.md"].map(async (path) => {
      const { response } = await fetchWith(path);

      return { mdSibling: response, path };
    }),
  );

  for (const { path, mdSibling } of mdSiblings) {
    expect(
      `${path} serves markdown with no Accept header`,
      mdSibling.status === 200 &&
        (mdSibling.headers.get("content-type") ?? "").startsWith("text/markdown"),
      `status ${mdSibling.status}, content-type ${mdSibling.headers.get("content-type") ?? "(none)"}`,
    );
  }

  const internalRequests = await Promise.all(
    (
      [
        ["a client-side navigation", { rsc: "1" }],
        ["a prefetch", { "next-router-prefetch": "1", rsc: "1" }],
        ["a Server Action", { accept: "text/x-component", "next-action": "abc123" }],
      ] as const
    ).map(async ([name, headers]) => ({
      name,
      response: await fetch(`${baseUrl}/about`, { headers, redirect: "manual" }),
    })),
  );

  for (const { name, response } of internalRequests) {
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

const checkProxyScope = async () => {
  const alternates = await Promise.all(
    (
      [
        ["/", "/index.md"],
        ["/about", "/about.md"],
      ] as const
    ).map(async ([path, target]) => {
      const { body } = await fetchWith(path);

      return { body, path, target };
    }),
  );

  for (const { path, target, body } of alternates) {
    const alternate =
      /<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*>/iu.exec(body)?.[0] ?? "";

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

type McpRequest =
  | {
      method: "initialize";
      params: {
        capabilities: Record<string, never>;
        clientInfo: { name: string; version: string };
        protocolVersion: string;
      };
    }
  | { method: "tools/list"; params: Record<string, never> }
  | { method: "resources/read"; params: { uri: string } }
  | {
      method: "tools/call";
      params: { arguments: { limit: number; query: string }; name: string };
    };

const mcpPayload = z.looseObject({
  result: z
    .looseObject({
      content: z.array(z.looseObject({ text: z.string().optional() })).optional(),
      contents: z.array(z.unknown()).optional(),
      serverInfo: z.looseObject({ name: z.string().optional() }).optional(),
      structuredContent: z.unknown().optional(),
      tools: z
        .array(
          z.looseObject({
            _meta: z
              .looseObject({
                ui: z.looseObject({ resourceUri: z.string().optional() }).optional(),
              })
              .optional(),
            annotations: z.looseObject({ destructiveHint: z.boolean().optional() }).optional(),
            name: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const mcpCall = async (request: McpRequest) => {
  const response = await fetch(`${baseUrl}/mcp`, {
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", ...request }),
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-06-18",
    },
    method: "POST",
  });

  const body = await response.text();

  const payload = body.startsWith("{")
    ? body
    : body
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length))
        .join("");

  return { payload: payload === "" ? null : mcpPayload.parse(JSON.parse(payload)), response };
};

type ListedTool = NonNullable<NonNullable<z.infer<typeof mcpPayload>["result"]>["tools"]>[number];

const checkGalleryTools = (listed: ListedTool[]) => {
  const searchTool = listed.find((tool) => tool.name === "search_components");
  expect(
    "MCP search_components opens the gallery view",
    searchTool?._meta?.ui?.resourceUri === GALLERY_RESOURCE_URI,
    JSON.stringify(searchTool?._meta ?? null).slice(0, 120),
  );
  expect(
    "MCP tools declare destructiveHint: false",
    listed.length > 0 && listed.every((tool) => tool.annotations?.destructiveHint === false),
    listed.map((tool) => `${tool.name}=${String(tool.annotations?.destructiveHint)}`).join(", "),
  );
};

const galleryViewItem = z.looseObject({
  _meta: z.looseObject({
    ui: z.looseObject({ csp: z.looseObject({ resourceDomains: z.array(z.string()).min(1) }) }),
  }),
  mimeType: z.literal("text/html;profile=mcp-app"),
  text: z.string().startsWith("<!doctype html>"),
});

const checkGalleryView = async () => {
  const { payload } = await mcpCall({
    method: "resources/read",
    params: { uri: GALLERY_RESOURCE_URI },
  });

  const item = galleryViewItem.safeParse(payload?.result?.contents?.[0]);
  expect(
    "MCP gallery view is an MCP App document that allows its cover origin",
    item.success,
    item.success
      ? item.data._meta.ui.csp.resourceDomains.join(", ")
      : item.error.message.slice(0, 120),
  );
};

const checkGallerySearch = async () => {
  const { payload } = await mcpCall({
    method: "tools/call",
    params: { arguments: { limit: 3, query: "slider" }, name: "search_components" },
  });

  const structured = galleryResultSchema.safeParse(payload?.result?.structuredContent);
  expect(
    "MCP search structuredContent is what the gallery view parses",
    structured.success && structured.data.components.length > 0,
    structured.success
      ? `${String(structured.data.components.length)} components`
      : structured.error.message.slice(0, 120),
  );
};

const checkMcpGallery = async (listed: ListedTool[]) => {
  checkGalleryTools(listed);
  await checkGalleryView();
  await checkGallerySearch();
};

const checkMcp = async () => {
  const { response: init, payload: initPayload } = await mcpCall({
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "check-agent-endpoints", version: "1.0.0" },
      protocolVersion: "2025-06-18",
    },
  });

  expect("POST /mcp initialize → 200", init.status === 200, `status ${init.status}`);
  expect(
    "MCP server identifies as uicapsule",
    initPayload?.result?.serverInfo?.name === "uicapsule",
    JSON.stringify(initPayload).slice(0, 120),
  );

  const { payload: tools } = await mcpCall({ method: "tools/list", params: {} });
  const names = (tools?.result?.tools ?? []).map((tool) => tool.name);
  expect(
    "MCP lists search_components and get_component",
    names.includes("search_components") && names.includes("get_component"),
    names.length > 0 ? names.join(", ") : JSON.stringify(tools).slice(0, 120),
  );

  await checkMcpGallery(tools?.result?.tools ?? []);

  const { payload: search } = await mcpCall({
    method: "tools/call",
    params: { arguments: { limit: 3, query: "slider" }, name: "search_components" },
  });

  const text = search?.result?.content?.[0]?.text ?? "";
  expect(
    "MCP search returns installable components",
    text.includes("npx shadcn@latest add"),
    text === "" ? JSON.stringify(search).slice(0, 120) : text.slice(0, 120),
  );
};

const checkTrustAnchors = async () => {
  const trustPages = await Promise.all(
    ["/about", "/contact", "/privacy", "/terms"].map(async (path) => ({
      path,
      ...(await fetchWith(path)),
    })),
  );

  for (const { path, response, body } of trustPages) {
    const text = visibleText(body);
    expect(`${path} → 200`, response.status === 200, `status ${response.status}`);

    if (path !== "/about") {
      expect(`${path} has 500+ chars of content`, text.length >= 500, `${text.length} chars`);
    }

    expect(
      `${path} has an <h1> and a canonical`,
      /<h1[^>]*>/iu.test(body) && /rel="canonical"/iu.test(body),
      "missing",
    );
  }

  const legalPages = await Promise.all(
    ["/privacy", "/terms"].map(async (path) => {
      const { body } = await fetchWith(path);

      return { body, path };
    }),
  );

  for (const { path, body } of legalPages) {
    const ids = new Set([...body.matchAll(/\sid="(?<id>[^"]+)"/gu)].map((match) => match[1]));
    const anchors = [...body.matchAll(/\shref="#(?<id>[^"]+)"/gu)].map((match) => match[1] ?? "");
    const missing = anchors.filter((id) => !ids.has(id));
    expect(
      `every #anchor on ${path} lands on an element id`,
      missing.length === 0,
      missing.join(", ") || "no anchors",
    );
  }

  const { body: privacyHtml } = await fetchWith("/privacy");
  expect(
    "/privacy carries an index of in-page anchors",
    (privacyHtml.match(/\shref="#/gu) ?? []).length >= 14,
    "fewer than 14 anchors",
  );
};

const main = async () => {
  consola.info(`Checking agent readiness of ${baseUrl}`);

  await checkHomePage();
  await checkMarkdownNegotiation();
  await checkProxyScope();
  await checkNotFound();
  await checkMachineFiles();
  await checkMcp();
  await checkTrustAnchors();

  for (const check of checks) {
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
