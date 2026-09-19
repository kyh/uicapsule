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
export const renderLlmsTxt = (components: ContentComponentSummary[]): string => {
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
      { href: "/about", label: "About", text: "what this is, how it is built, how to install it" },
      { href: "/contact", label: "Contact", text: "email and GitHub issues" },
      { href: "/privacy", label: "Privacy", text: "what is collected and who processes it" },
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
