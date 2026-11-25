import { siteConfig } from "@/lib/site-config";

import { componentLine, renderList, taxonomyLines } from "./markdown";
import {
  agentEndpoints,
  siteIntroParagraphs,
  siteSummary,
  siteUsageParagraphs,
  whenToUse,
} from "./site-overview";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

/**
 * `/llms.txt`, to the llmstxt.org format: an H1, a blockquote summary, then
 * free-form sections containing no headings, then H2-delimited link lists.
 *
 * The when-to-use guidance is deliberately in the pre-H2 block rather than
 * under its own `##` — the spec reserves H2 sections for link lists, so a
 * `## When to use this` full of prose would be off-format.
 */
export const renderLlmsTxt = (components: ContentComponentSummary[]) => {
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteSummary}`,
    "",
    ...siteIntroParagraphs.flatMap((paragraph) => [paragraph, ""]),
    "**When to use this:**",
    "",
    renderList(whenToUse),
    "",
    ...siteUsageParagraphs.flatMap((paragraph) => [paragraph, ""]),
    ...taxonomyLines(),
    "",
    "## Components",
    "",
    ...components.map(componentLine),
    "",
    "## Pages",
    "",
    renderList([
      { href: "/", label: "Home", text: "the component gallery, filterable" },
      { href: "/about", label: "About", text: "who makes this, and why" },
      { href: "/install", label: "Install", text: "the MCP server and the browser extension" },
      {
        href: "/install/mcp",
        label: "MCP server",
        text: "how to install the MCP server, and what it gives an agent",
      },
      {
        href: "/install/extension",
        label: "Browser extension",
        text: "how to install the extension that files component requests from any page",
      },
      { href: "/contact", label: "Contact", text: "email and GitHub issues" },
      {
        href: "/privacy",
        label: "Privacy Policy",
        text: "what is collected, who processes it, and your rights",
      },
      {
        href: "/terms",
        label: "Terms of Use",
        text: "the terms for using the site and its components",
      },
    ]),
    "",
    "## Machine-readable endpoints",
    "",
    renderList(agentEndpoints),
    "",
    "## Optional",
    "",
    renderList([
      { href: siteConfig.repository, label: "Source code", text: "the gallery itself, on GitHub" },
      {
        href: `${siteConfig.repository}/issues`,
        label: "Issue tracker",
        text: "bugs and component requests",
      },
      { href: "/robots.txt", label: "robots.txt", text: "crawl rules" },
    ]),
  ];

  return `${lines.join("\n").trimEnd()}\n`;
};
