import { siteConfig } from "@/lib/site-config";

import { absoluteUrl } from "./markdown";
import { siteSummary } from "./site-overview";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import type { ProsePage } from "./site-pages";

/**
 * A JSON-LD document: plain JSON, no wider than JSON actually is. `undefined`
 * is included because `JSON.stringify` drops those properties, which is how an
 * optional field (a component with no description) is left out.
 */
export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLdNode = { [key: string]: JsonLdValue };

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const APPLICATION_ID = `${siteConfig.url}/#application`;

/**
 * `Organization` is the identity every other node points back at.
 *
 * There is deliberately no `address`: UICapsule is a personal open-source
 * project with no business premises, and inventing a PostalAddress to satisfy a
 * validator would be worse than omitting one. `contactPoint` carries the real,
 * already-published address.
 */
export const buildOrganization = () =>
  ({
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteSummary,
    email: siteConfig.email,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/favicon/favicon-96x96.png`,
      width: 96,
      height: 96,
    },
    image: `${siteConfig.url}/og.jpg`,
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.email,
        url: absoluteUrl("/contact"),
        availableLanguage: ["en"],
      },
      {
        "@type": "ContactPoint",
        contactType: "technical support",
        email: siteConfig.email,
        url: `${siteConfig.repository}/issues`,
        availableLanguage: ["en"],
      },
    ],
    sameAs: siteConfig.sameAs,
  }) satisfies JsonLdNode;

export const buildWebSite = () =>
  ({
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-US",
    publisher: { "@id": ORGANIZATION_ID },
  }) satisfies JsonLdNode;

/**
 * The gallery itself, as the thing an agent would recommend: free, MIT, no
 * account, installable through the shadcn CLI.
 */
export const buildSoftwareApplication = (componentCount: number) =>
  ({
    "@type": "SoftwareApplication",
    "@id": APPLICATION_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteSummary,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "UI component library",
    operatingSystem: "Any",
    softwareRequirements: "React 19, Tailwind CSS 4",
    featureList: [
      `${componentCount} live, self-contained React components`,
      "shadcn registry install for every component",
      "Full source and dependency list per component",
      "Markdown representation of every page via Accept: text/markdown",
    ],
    license: "https://opensource.org/licenses/MIT",
    codeRepository: siteConfig.repository,
    isAccessibleForFree: true,
    publisher: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  }) satisfies JsonLdNode;

const componentUrl = (slug: string): string => absoluteUrl(`/ui/${slug}`);

export const buildCollectionPage = (components: ContentComponentSummary[]) =>
  ({
    "@type": "CollectionPage",
    "@id": `${siteConfig.url}/#webpage`,
    url: siteConfig.url,
    name: `${siteConfig.name} — ${siteConfig.description}`,
    description: siteSummary,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": APPLICATION_ID },
    // Names and URLs only. Descriptions are already in the page text and in
    // /llms.txt, and repeating them here is pure markup weight on the one
    // page whose text-to-markup ratio matters most.
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: components.length,
      itemListElement: components.map((component, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: componentUrl(component.slug),
        name: component.name,
      })),
    },
  }) satisfies JsonLdNode;

export const buildHomeGraph = (components: ContentComponentSummary[]) =>
  ({
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildWebSite(),
      buildSoftwareApplication(components.length),
      buildCollectionPage(components),
    ],
  }) satisfies JsonLdNode;

export const buildSoftwareSourceCode = (component: ContentComponentSummary) =>
  ({
    "@type": "SoftwareSourceCode",
    "@id": `${componentUrl(component.slug)}#component`,
    name: component.name,
    url: componentUrl(component.slug),
    description: component.description,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    codeRepository: siteConfig.repository,
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    keywords: (component.tags ?? []).join(", ") || undefined,
    author: (
      component.authors ?? [{ name: siteConfig.author.name, url: siteConfig.author.url }]
    ).map((author) => ({ "@type": "Person", name: author.name, url: author.url })),
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  }) satisfies JsonLdNode;

export const buildComponentBreadcrumb = (component: ContentComponentSummary) =>
  ({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: component.name,
        item: componentUrl(component.slug),
      },
    ],
  }) satisfies JsonLdNode;

export const buildComponentGraph = (component: ContentComponentSummary) =>
  ({
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildSoftwareSourceCode(component),
      buildComponentBreadcrumb(component),
    ],
  }) satisfies JsonLdNode;

export const buildWebPage = (page: ProsePage) =>
  ({
    "@type": "WebPage",
    "@id": `${absoluteUrl(page.path)}#webpage`,
    url: absoluteUrl(page.path),
    name: page.title,
    headline: page.heading,
    description: page.description,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
  }) satisfies JsonLdNode;

export const buildProsePageGraph = (page: ProsePage) =>
  ({
    "@context": "https://schema.org",
    "@graph": [buildOrganization(), buildWebPage(page)],
  }) satisfies JsonLdNode;

/**
 * `JSON.stringify` output is dropped into a `<script>` body, so any `<` that
 * could start a `</script>` has to be escaped. `<` is valid inside a JSON
 * string and parses back to `<`.
 */
export const serializeJsonLd = (node: JsonLdNode): string =>
  JSON.stringify(node).replaceAll("<", "\\u003c");
