import Link from "next/link";
import {
  contentCategories,
  contentElements,
  contentStyles,
} from "@/lib/content/content-categories";

import { JsonLd } from "@/components/json-ld";
import {
  agentEndpoints,
  siteIntroParagraphs,
  siteUsageParagraphs,
  whenToUse,
} from "@/lib/agent/site-overview";
import { buildHomeGraph } from "@/lib/agent/structured-data";
import { getContentList } from "@/lib/content-data";
import { siteConfig } from "@/lib/site-config";

import type { ContentFilter } from "@/lib/content/content-categories";
import type { ProseListItem } from "@/lib/agent/site-pages";

/**
 * The home page's text layer: an `<h1>`, what the site is, and a linked index
 * of every component in the grid.
 *
 * The grid itself is covers and hover states — a page of images with no heading
 * and barely a paragraph of prose. That reads as an empty page to a crawler
 * that does not run JavaScript, to a text-mode browser, and to a screen reader
 * looking for a landmark to start from. This renders the same information the
 * grid conveys visually as text, so all three get the real page.
 *
 * It is deliberately *not* wrapped in `<Suspense>`: everything it reads is a
 * `use cache` function, so it prerenders into the static shell and is present
 * in the first byte of HTML rather than streaming in behind the grid.
 */

const filterItems = (filters: ContentFilter[], key: string): ProseListItem[] =>
  filters.flatMap((filter) => [
    { label: filter.name, href: `/?${key}=${filter.slug}` },
    ...(filter.subcategories ?? []).map((sub) => ({
      label: sub.name,
      href: `/?${key}=${sub.slug}`,
    })),
  ]);

const OutlineList = ({ items }: { items: ProseListItem[] }) => (
  <ul>
    {items.map((item) => (
      <li key={`${item.label}-${item.href ?? ""}`}>
        {item.href?.startsWith("/") ? <Link href={item.href}>{item.label}</Link> : item.label}
        {item.text ? ` — ${item.text}` : null}
      </li>
    ))}
  </ul>
);

export const GalleryOutline = async () => {
  const components = await getContentList([]);

  return (
    <section aria-labelledby="gallery-outline-heading" className="sr-only">
      {/* One interpolation, not three: React writes `<!-- -->` separators
          between adjacent expressions, and those land inside the `h1` text. */}
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

      <h2>Browse by category</h2>
      <OutlineList items={filterItems(contentCategories, "category")} />

      <h2>All {components.length} components</h2>
      <ul>
        {components.map((component) => (
          <li key={component.slug}>
            <Link href={`/ui/${component.slug}`}>{component.name}</Link>
            {component.description ? ` — ${component.description}` : null}
            {(component.tags ?? []).length > 0
              ? ` Tags: ${(component.tags ?? []).join(", ")}.`
              : null}
          </li>
        ))}
      </ul>

      <h2>More about {siteConfig.name}</h2>
      <OutlineList
        items={[
          { label: "About", href: "/about", text: "what this is and how to install a component" },
          { label: "Contact", href: "/contact", text: "email and GitHub issues" },
          { label: "Privacy", href: "/privacy", text: "what is collected and who processes it" },
          { label: "Inspiration", href: "/inspiration", text: "other places worth looking at" },
        ]}
      />
    </section>
  );
};

export const GalleryStructuredData = async () => (
  <JsonLd node={buildHomeGraph(await getContentList([]))} />
);
