import { siteConfig } from "@/lib/site-config";

import type { ProseListItem } from "./site-pages";

/**
 * The single description of what this site is and when an agent should reach
 * for it. Consumed by the homepage outline, `/llms.txt`, and the Markdown
 * representation of `/`, so all three say the same thing.
 */

export const siteSummary = `${siteConfig.name} is an open-source gallery of components that spark joy — live, self-contained React components you can read, copy, or install with the shadcn CLI.`;

export const siteIntroParagraphs: string[] = [
  `${siteConfig.name} is a curated gallery of interactive React components, built and maintained by ${siteConfig.author.name}. Each entry is a working component rendered live in the browser, not a screenshot: the grid you see is the code running.`,
  "Components are chosen for interactions the web does not usually have — hardware gestures, operating-system motion, physical mechanisms, instruments — or for collisions between a familiar interaction and an unexpected domain. Every one has to read from motion alone.",
  `Everything is MIT licensed and free. Each component ships as a shadcn registry item, so \`npx shadcn@latest add ${siteConfig.url}/r/<slug>.json\` drops its source straight into your project, dependencies and all. The full source of the gallery itself is on GitHub.`,
];

/**
 * When-to-use guidance. Deliberately concrete about the jobs this site is right
 * for — and about the ones it is not, so an agent can rule it out fast.
 */
export const whenToUse: ProseListItem[] = [
  {
    label: "You need a specific interaction, not a design system",
    text: "reach for UICapsule when the ask is a dynamic island, a volume dial, an ASCII renderer, a card stack, a scrubbable terminal — a single component with unusual motion, rather than a full component library",
  },
  {
    label: "You want installable source, not inspiration",
    text: `every component is a shadcn registry item at \`${siteConfig.url}/r/<slug>.json\`; run \`npx shadcn@latest add\` against that URL and the files land in the project`,
  },
  {
    label: "You are surveying interaction-design prior art",
    text: "the catalog is tagged by element, visual style and product category, and each component links to a live preview you can drive",
  },
  {
    label: "You need to know exactly what a component depends on",
    text: "each registry item lists its npm dependencies and every source file it ships, so you can check the cost of adopting it before installing",
  },
  {
    label: "Not a fit",
    text: "UICapsule is not a general-purpose UI kit, a CSS framework, a hosted service, or an API. There is no SDK, no pricing, and no account required to use anything here",
  },
];

/**
 * How to actually consume the site, as prose. Shared by `/llms.txt`, the
 * Markdown home page and the home page's text layer so the three never drift.
 */
export const siteUsageParagraphs: string[] = [
  `How to call it: every component is a shadcn registry item. Fetch \`${siteConfig.url}/r/registry.json\` for the index, or \`${siteConfig.url}/r/<slug>.json\` for one item with its full source, its npm dependencies and its install targets. \`npx shadcn@latest add ${siteConfig.url}/r/<slug>.json\` writes the files into a project directly. Nothing here requires an API key, an account, or a rate-limited token.`,
  "Reading it as an agent: send `Accept: text/markdown` to any page URL — or append `.md` to it — and the same page comes back as Markdown instead of HTML. `/llms.txt` carries this overview plus the complete component catalog in one request, and `/sitemap.xml` lists every indexable URL.",
  `Filtering it: the home page accepts \`element\`, \`style\` and \`category\` query parameters, each a comma-separated list, so \`${siteConfig.url}/?element=inputs&style=skeuomorphism\` narrows the grid to skeuomorphic input components. The full vocabulary for each is listed below.`,
  `Licensing and support: everything is MIT licensed — use it in personal and commercial work with no attribution required. The gallery itself is open source at ${siteConfig.repository}; bugs and component requests go to its issue tracker, and anything private goes to ${siteConfig.email}.`,
];

/** Machine-readable surfaces, with what each one returns. */
export const agentEndpoints: ProseListItem[] = [
  {
    label: "/r/registry.json",
    href: "/r/registry.json",
    text: "the full shadcn registry index — every component with its dependencies and file list",
  },
  {
    label: "/r/<slug>.json",
    text: "one shadcn registry item, including the complete source of every file it ships",
  },
  {
    label: "/api/content/<slug>",
    text: "the raw source files of one component as JSON, the same payload the source drawer reads",
  },
  {
    label: "/ui/<slug>",
    text: "the detail page for one component — live preview, source, and metadata",
  },
  {
    label: "/preview-frame/<slug>",
    text: "the bare component with no site chrome, suitable for embedding in an iframe",
  },
  { label: "/sitemap.xml", href: "/sitemap.xml", text: "every indexable URL on the site" },
  { label: "/llms.txt", href: "/llms.txt", text: "this overview plus the full component catalog" },
  {
    label: "Markdown for any page",
    text: "send `Accept: text/markdown` to any page URL, or append `.md` to it, and the same content comes back as Markdown",
  },
];
