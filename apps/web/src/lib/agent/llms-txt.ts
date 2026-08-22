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
      { label: "Home", href: "/", text: "the component gallery, filterable" },
      { label: "About", href: "/about", text: "what this is, how it is built, how to install it" },
      { label: "Contact", href: "/contact", text: "email and GitHub issues" },
      { label: "Privacy", href: "/privacy", text: "what is collected and who processes it" },
      { label: "Inspiration", href: "/inspiration", text: "other places worth looking at" },
    ]),
    "",
    "## Machine-readable endpoints",
    "",
    renderList(agentEndpoints),
    "",
    "## Optional",
    "",
    renderList([
      { label: "Source code", href: siteConfig.repository, text: "the gallery itself, on GitHub" },
      {
        label: "Issue tracker",
        href: `${siteConfig.repository}/issues`,
        text: "bugs and component requests",
      },
      { label: "robots.txt", href: "/robots.txt", text: "crawl rules" },
    ]),
  ];

  return `${lines.join("\n").trimEnd()}\n`;
};
