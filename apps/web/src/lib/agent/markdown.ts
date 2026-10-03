import { contentElements, contentStyles } from "@/lib/content/content-categories";
import { siteConfig } from "@/lib/site-config";

import {
  agentEndpoints,
  siteIntroParagraphs,
  siteSummary,
  siteUsageParagraphs,
  whenToUse,
} from "./site-overview";

import { parseInline } from "./inline-markup";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import type { ProseBlock, ProseListItem, ProsePage } from "./site-pages";

/**
 * Markdown representations of the site, served from the same URLs as the HTML
 * via `Accept: text/markdown` (see `src/proxy.ts`). Pure string building — the
 * route handler supplies the data.
 */

/** Site paths become absolute URLs; off-site, `mailto:` and in-page `#anchor` hrefs pass through. */
export const absoluteUrl = (path: string): string =>
  path.startsWith("http") || path.startsWith("mailto:") || path.startsWith("#")
    ? path
    : `${siteConfig.url}${path}`;

/** Copy as Markdown: its inline markup already is Markdown, except that site paths go absolute. */
const renderInline = (text: string): string =>
  parseInline(text)
    .map((token) => {
      if (token.kind === "bold") {
        return `**${token.text}**`;
      }
      if (token.kind === "code") {
        return `\`${token.text}\``;
      }
      if (token.kind === "link") {
        return `[${token.text}](${absoluteUrl(token.href)})`;
      }
      return token.text;
    })
    .join("");

const renderListItem = (item: ProseListItem): string => {
  const label = item.href ? `[${item.label}](${absoluteUrl(item.href)})` : `**${item.label}**`;
  return item.text ? `- ${label}: ${renderInline(item.text)}` : `- ${label}`;
};

export const renderList = (items: ProseListItem[]): string => items.map(renderListItem).join("\n");

/** A GFM table cell holds one line, and a bare `|` would end the cell. */
const tableCell = (text: string): string => renderInline(text).replaceAll("|", String.raw`\|`);

const tableRow = (cells: string[]): string => `| ${cells.map(tableCell).join(" | ")} |`;

const renderTable = (columns: string[], rows: string[][]): string =>
  [tableRow(columns), `| ${columns.map(() => "---").join(" | ")} |`, ...rows.map(tableRow)].join(
    "\n",
  );

const renderBlock = (block: ProseBlock): string => {
  switch (block.kind) {
    case "heading": {
      return `${block.level === 3 ? "###" : "##"} ${block.text}`;
    }
    case "list": {
      return renderList(block.items);
    }
    case "bullets": {
      return block.items.map((item) => `- ${renderInline(item)}`).join("\n");
    }
    case "table": {
      return renderTable(block.columns, block.rows);
    }
    case "divider": {
      return "---";
    }
    default: {
      return renderInline(block.text);
    }
  }
};

const withTrailingNewline = (body: string): string => `${body.trimEnd()}\n`;

/** One catalog entry, shared by the Markdown home page and `/llms.txt`. */
export const componentLine = (component: ContentComponentSummary): string => {
  const link = `[${component.name}](${absoluteUrl(`/ui/${component.slug}`)})`;
  const tags = component.tags ?? [];
  const notes = [component.description, tags.length > 0 ? `tags: ${tags.join(", ")}` : ""]
    .filter(Boolean)
    .join(" — ");
  return notes ? `- ${link}: ${notes}` : `- ${link}`;
};

const taxonomyLine = (heading: string, slugs: string[]): string =>
  `- **${heading}**: ${slugs.join(", ")}`;

export const taxonomyLines = (): string[] => [
  taxonomyLine(
    "Elements",
    contentElements.map((element) => element.slug),
  ),
  taxonomyLine(
    "Styles",
    contentStyles.map((style) => style.slug),
  ),
];

export const renderProsePageMarkdown = (page: ProsePage): string =>
  withTrailingNewline(
    [
      `# ${page.heading}`,
      "",
      `> ${page.description}`,
      "",
      ...page.blocks.flatMap((block) => [renderBlock(block), ""]),
      "---",
      "",
      `[${siteConfig.name}](${siteConfig.url}) · [All pages](${absoluteUrl("/sitemap.xml")}) · [llms.txt](${absoluteUrl("/llms.txt")})`,
    ].join("\n"),
  );

export const renderHomeMarkdown = (components: ContentComponentSummary[]): string =>
  withTrailingNewline(
    [
      `# ${siteConfig.name} — ${siteConfig.description}`,
      "",
      `> ${siteSummary}`,
      "",
      ...siteIntroParagraphs.flatMap((paragraph) => [paragraph, ""]),
      "## When to use this",
      "",
      renderList(whenToUse),
      "",
      "## How to use it",
      "",
      ...siteUsageParagraphs.flatMap((paragraph) => [paragraph, ""]),
      ...taxonomyLines(),
      "",
      "## Machine-readable endpoints",
      "",
      renderList(agentEndpoints),
      "",
      `## Components (${components.length})`,
      "",
      components.map(componentLine).join("\n"),
      "",
      "## Pages",
      "",
      renderList([
        { href: "/about", label: "About", text: "what this is and how to install a component" },
        { href: "/contact", label: "Contact", text: "email and GitHub" },
        {
          href: "/privacy",
          label: "Privacy Policy",
          text: "what is collected, who processes it, and your rights",
        },
      ]),
    ].join("\n"),
  );

export const renderComponentMarkdown = (
  component: ContentComponentSummary,
  sourcePaths: string[],
): string => {
  const facts: ProseListItem[] = [
    { label: "Slug", text: `\`${component.slug}\`` },
    ...(component.category ? [{ label: "Category", text: component.category }] : []),
    ...((component.tags ?? []).length > 0
      ? [{ label: "Tags", text: (component.tags ?? []).join(", ") }]
      : []),
    ...(component.authors ?? []).map((author) => ({
      label: "Author",
      text: `[${author.name}](${author.url})`,
    })),
    ...(component.inspiredBy ?? []).map((source) => ({
      label: "Inspired by",
      text: `[${source.label}](${source.url})`,
    })),
  ];

  const links: ProseListItem[] =
    component.type === "remote"
      ? [
          {
            href: component.iframeUrl,
            label: "Live preview",
            text: "hosted by the original author",
          },
          { href: component.sourceUrl, label: "Source", text: "on the original author's site" },
        ]
      : [
          {
            href: `/r/${component.slug}.json`,
            label: "Registry item",
            text: `install with \`npx shadcn@latest add ${siteConfig.url}/r/${component.slug}.json\``,
          },
          {
            href: `/api/content/${component.slug}`,
            label: "Raw source JSON",
            text: "every file, as JSON",
          },
          {
            href: `/preview-frame/${component.slug}`,
            label: "Bare preview",
            text: "the component with no site chrome",
          },
        ];

  return withTrailingNewline(
    [
      `# ${component.name}`,
      "",
      `> ${component.description}`,
      "",
      "## Details",
      "",
      renderList(facts),
      "",
      "## Links",
      "",
      renderList(links),
      ...(sourcePaths.length > 0
        ? [
            "",
            `## Files (${sourcePaths.length})`,
            "",
            "Full contents are in the registry item linked above.",
            "",
            sourcePaths.map((path) => `- \`${path}\``).join("\n"),
          ]
        : []),
      "",
      "---",
      "",
      `[${siteConfig.name}](${siteConfig.url}) · [All components](${absoluteUrl("/llms.txt")})`,
    ].join("\n"),
  );
};

/**
 * The body of a 404. Same words in both representations: the HTML `not-found`
 * page renders this list too, so an agent that lands on a dead URL gets the
 * same recovery paths whichever format it asked for.
 */
export const notFoundRecoveryLinks: ProseListItem[] = [
  { href: "/", label: "Home", text: "the full component gallery" },
  { href: "/llms.txt", label: "/llms.txt", text: "site overview and the complete component list" },
  { href: "/sitemap.xml", label: "/sitemap.xml", text: "every indexable URL" },
  { href: "/r/registry.json", label: "/r/registry.json", text: "the shadcn registry index" },
  { href: "/about", label: "About", text: "what this site is" },
  { href: "/contact", label: "Contact", text: "how to reach a human" },
];

export const renderNotFoundMarkdown = (pathname: string): string =>
  withTrailingNewline(
    [
      "# 404 — Page not found",
      "",
      `> \`${pathname}\` does not exist on ${siteConfig.url}. Nothing was moved here; this URL has no content.`,
      "",
      "Try one of these instead:",
      "",
      renderList(notFoundRecoveryLinks),
      "",
      `Component pages live at \`/ui/<slug>\`. If you are looking for a specific component, [llms.txt](${absoluteUrl("/llms.txt")}) lists every slug.`,
    ].join("\n"),
  );
