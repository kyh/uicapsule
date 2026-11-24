import Link from "next/link";
import { contentElements, contentStyles } from "@/lib/content/content-categories";

import { JsonLd } from "@/components/json-ld";
import {
  agentEndpoints,
  siteIntroParagraphs,
  siteUsageParagraphs,
  whenToUse,
} from "@/lib/agent/site-overview";
import { rendersOutsideRouter } from "@/lib/agent/site-pages";
import { buildHomeGraph } from "@/lib/agent/structured-data";
import { getAllContent } from "@/lib/content/content-data";
import { siteConfig } from "@/lib/site-config";
import { homeVideo } from "@/lib/content/social-video";

import type { ContentFilter } from "@/lib/content/content-categories";
import type { ProseListItem } from "@/lib/agent/site-pages";

const filterItems = (filters: ContentFilter[], key: string) =>
  filters.map((filter) => ({ href: `/?${key}=${filter.slug}`, label: filter.name }));

const OutlineLink = ({ item }: { item: ProseListItem }) => {
  if (!item.href) {
    return item.label;
  }

  if (rendersOutsideRouter(item.href)) {
    return <a href={item.href}>{item.label}</a>;
  }

  return <Link href={item.href}>{item.label}</Link>;
};

const OutlineList = ({ items }: { items: ProseListItem[] }) => (
  <ul>
    {items.map((item) => (
      <li key={`${item.label}-${item.href ?? ""}`}>
        <OutlineLink item={item} />
        {item.text ? ` — ${item.text}` : null}
      </li>
    ))}
  </ul>
);

export const GalleryOutline = async () => {
  const components = await getAllContent();

  return (
    <section aria-labelledby="gallery-outline-heading" className="sr-only">
      <h1 id="gallery-outline-heading">{`${siteConfig.name} — ${siteConfig.description}`}</h1>
      {siteIntroParagraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>When to use this</h2>
      <OutlineList items={whenToUse} />

      <h2>How to use it</h2>
      {siteUsageParagraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>Machine-readable endpoints</h2>
      <OutlineList items={agentEndpoints} />

      <h2>Browse by element</h2>
      <OutlineList items={filterItems(contentElements, "element")} />

      <h2>Browse by style</h2>
      <OutlineList items={filterItems(contentStyles, "style")} />

      <h2>All {components.length} components</h2>
      <ul>
        {components.map((component) => (
          <li key={component.slug}>
            <Link href={`/ui/${component.slug}`}>{component.name}</Link>
            {` — ${component.description}`}
            {(component.tags ?? []).length > 0
              ? ` Tags: ${(component.tags ?? []).join(", ")}.`
              : null}
          </li>
        ))}
      </ul>

      <h2>More about {siteConfig.name}</h2>
      <OutlineList
        items={[
          { href: "/about", label: "About", text: "what this is and how to install a component" },
          { href: "/contact", label: "Contact", text: "email and GitHub issues" },
          { href: "/privacy", label: "Privacy Policy", text: "what is collected and your rights" },
          { href: "/terms", label: "Terms of Use", text: "the terms for using the site" },
        ]}
      />
    </section>
  );
};

export const GalleryStructuredData = async () => (
  <JsonLd node={buildHomeGraph(await getAllContent(), homeVideo)} />
);
