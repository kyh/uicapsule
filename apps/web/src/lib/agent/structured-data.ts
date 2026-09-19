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

export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

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
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    alternateName: siteConfig.shortName,
    contactPoint: [
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "customer support",
        email: siteConfig.email,
        url: absoluteUrl("/contact"),
      },
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "technical support",
        email: siteConfig.email,
        url: `${siteConfig.repository}/issues`,
      },
    ],
    description: siteSummary,
    email: siteConfig.email,
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    image: `${siteConfig.url}/og.jpg`,
    logo: {
      "@type": "ImageObject",
      height: 96,
      url: `${siteConfig.url}/favicon/favicon-96x96.png`,
      width: 96,
    },
    name: siteConfig.name,
    sameAs: siteConfig.sameAs,
    url: siteConfig.url,
  }) satisfies JsonLdNode;

export const buildWebSite = () =>
  ({
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    description: siteConfig.description,
    inLanguage: "en-US",
    name: siteConfig.name,
    publisher: { "@id": ORGANIZATION_ID },
    url: siteConfig.url,
  }) satisfies JsonLdNode;

/**
 * The gallery itself, as the thing an agent would recommend: free, MIT, no
 * account, installable through the shadcn CLI.
 */
export const buildSoftwareApplication = (componentCount: number) =>
  ({
    "@id": APPLICATION_ID,
    "@type": "SoftwareApplication",
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "UI component library",
    codeRepository: siteConfig.repository,
    description: siteSummary,
    featureList: [
      `${componentCount} live, self-contained React components`,
      "shadcn registry install for every component",
      "Full source and dependency list per component",
      "Markdown representation of every page via Accept: text/markdown",
    ],
    isAccessibleForFree: true,
    license: "https://opensource.org/licenses/MIT",
    name: siteConfig.name,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Any",
    publisher: { "@id": ORGANIZATION_ID },
    softwareRequirements: "React 19, Tailwind CSS 4",
    url: siteConfig.url,
  }) satisfies JsonLdNode;

const componentUrl = (slug: string): string => absoluteUrl(`/ui/${slug}`);

export const buildCollectionPage = (components: ContentComponentSummary[]) =>
  ({
    "@id": `${siteConfig.url}/#webpage`,
    "@type": "CollectionPage",
    about: { "@id": APPLICATION_ID },
    description: siteSummary,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    // Names and URLs only. Descriptions are already in the page text and in
    // /llms.txt, and repeating them here is pure markup weight on the one
    // page whose text-to-markup ratio matters most.
    mainEntity: {
      "@type": "ItemList",
      itemListElement: components.map((component, index) => ({
        "@type": "ListItem",
        name: component.name,
        position: index + 1,
        url: componentUrl(component.slug),
      })),
      numberOfItems: components.length,
    },
    name: `${siteConfig.name} — ${siteConfig.description}`,
    url: siteConfig.url,
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
    "@id": `${componentUrl(component.slug)}#component`,
    "@type": "SoftwareSourceCode",
    author: (
      component.authors ?? [{ name: siteConfig.author.name, url: siteConfig.author.url }]
    ).map((author) => ({ "@type": "Person", name: author.name, url: author.url })),
    codeRepository: siteConfig.repository,
    description: component.description,
    isAccessibleForFree: true,
    isPartOf: { "@id": WEBSITE_ID },
    keywords: (component.tags ?? []).join(", ") || undefined,
    license: "https://opensource.org/licenses/MIT",
    name: component.name,
    programmingLanguage: "TypeScript",
    publisher: { "@id": ORGANIZATION_ID },
    runtimePlatform: "React",
    url: componentUrl(component.slug),
  }) satisfies JsonLdNode;

export const buildComponentBreadcrumb = (component: ContentComponentSummary) =>
  ({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", item: siteConfig.url, name: siteConfig.name, position: 1 },
      {
        "@type": "ListItem",
        item: componentUrl(component.slug),
        name: component.name,
        position: 2,
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
    "@id": `${absoluteUrl(page.path)}#webpage`,
    "@type": "WebPage",
    about: { "@id": ORGANIZATION_ID },
    description: page.description,
    headline: page.heading,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    name: page.title,
    url: absoluteUrl(page.path),
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
