import { Fragment } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { parseInline } from "@/lib/agent/inline-markup";
import { headingIds, rendersOutsideRouter } from "@/lib/agent/site-pages";

import type { ProseBlock, ProseListItem, ProsePage } from "@/lib/agent/site-pages";

/**
 * Renders a `ProsePage` — the same definition the Markdown representation is
 * built from, so `/privacy` and `/privacy` with `Accept: text/markdown` can
 * never drift apart.
 */

const isOffSite = (href: string) => href.startsWith("http") || href.startsWith("mailto:");

const ProseLink = ({ href, children }: { href: string; children: ReactNode }) => {
  const className = "text-foreground hover:text-primary underline underline-offset-4 transition";
  if (rendersOutsideRouter(href)) {
    // Only a genuinely off-site link opens in a new tab; `/llms.txt`, `#anchors`
    // and friends are this site's own and stay in place.
    const offSite = isOffSite(href);
    return (
      <a
        className={className}
        href={href}
        rel={offSite ? "noreferrer" : undefined}
        target={offSite ? "_blank" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
};

/** The copy's inline markup (see `inline-markup.ts`) as elements. Nothing else in it is markup. */
const Inline = ({ text }: { text: string }) =>
  parseInline(text).map((token, index) => {
    if (token.kind === "bold") {
      return (
        <strong key={index} className="text-foreground font-medium">
          {token.text}
        </strong>
      );
    }
    if (token.kind === "code") {
      return (
        <code
          key={index}
          className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs"
        >
          {token.text}
        </code>
      );
    }
    if (token.kind === "link") {
      return (
        <ProseLink key={index} href={token.href}>
          {token.text}
        </ProseLink>
      );
    }
    return <Fragment key={index}>{token.text}</Fragment>;
  });

const ProseItem = ({ item }: { item: ProseListItem }) => (
  <li>
    {item.href ? (
      <ProseLink href={item.href}>{item.label}</ProseLink>
    ) : (
      <span className="text-foreground">{item.label}</span>
    )}
    {item.text ? (
      <>
        {" — "}
        <Inline text={item.text} />
      </>
    ) : null}
  </li>
);

const listClassName = "flex list-disc flex-col gap-2 pl-5";

// The header is sticky, so an anchored heading stops clear of it.
const headingClassName = "text-foreground scroll-mt-20";

// Wide enough to keep five columns readable, narrow enough to fit the desktop prose column;
// a phone scrolls the table inside its own box rather than the page.
const ProseTable = ({ columns, rows }: { columns: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-xl border-collapse text-left text-sm">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column}
              className="text-foreground border-b px-3 py-2 align-bottom font-medium"
            >
              <Inline text={column} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            {row.map((cell, index) => (
              <td key={index} className="border-b px-3 py-2 align-top">
                <Inline text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProseBlockView = ({ block, id }: { block: ProseBlock; id?: string }) => {
  switch (block.kind) {
    case "heading": {
      return block.level === 3 ? (
        <h3 id={id} className={`${headingClassName} mt-2`}>
          {block.text}
        </h3>
      ) : (
        <h2 id={id} className={`${headingClassName} mt-4 text-lg`}>
          {block.text}
        </h2>
      );
    }
    case "list": {
      return (
        <ul className={listClassName}>
          {block.items.map((item) => (
            <ProseItem key={item.label} item={item} />
          ))}
        </ul>
      );
    }
    case "bullets": {
      return (
        <ul className={listClassName}>
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    }
    case "table": {
      return <ProseTable columns={block.columns} rows={block.rows} />;
    }
    case "divider": {
      return <hr className="my-2" />;
    }
    default: {
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );
    }
  }
};

export const ProsePageView = ({ page, children }: { page: ProsePage; children?: ReactNode }) => {
  const ids = headingIds(page);
  return (
    <main className="flex min-h-[calc(100dvh-(--spacing(32)))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">{page.heading}</h1>
      <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 leading-relaxed">
        {page.blocks.map((block, index) => (
          <ProseBlockView key={index} block={block} id={ids[index]} />
        ))}
        {children}
      </div>
    </main>
  );
};
