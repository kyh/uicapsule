import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import type { ProseBlock, ProseListItem, ProsePage } from "@/lib/agent/site-pages";

/**
 * Renders a `ProsePage` — the same definition the Markdown representation is
 * built from, so `/privacy` and `/privacy` with `Accept: text/markdown` can
 * never drift apart.
 */

/** Turns `a \`b\` c` into `a <code>b</code> c`. Nothing else in the copy is markup. */
const withInlineCode = (text: string): ReactNode =>
  text.split("`").map((segment, index) =>
    index % 2 === 1 ? (
      <code key={index} className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs">
        {segment}
      </code>
    ) : (
      <Fragment key={index}>{segment}</Fragment>
    ),
  );

const isExternal = (href: string) => href.startsWith("http") || href.startsWith("mailto:");

const ProseLink = ({ href, children }: { href: string; children: ReactNode }) => {
  const className = "text-foreground hover:text-primary underline underline-offset-4 transition";
  if (isExternal(href)) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
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

const ProseItem = ({ item }: { item: ProseListItem }) => (
  <li>
    {item.href ? (
      <ProseLink href={item.href}>{item.label}</ProseLink>
    ) : (
      <span className="text-foreground">{item.label}</span>
    )}
    {item.text ? <> — {withInlineCode(item.text)}</> : null}
  </li>
);

const ProseBlockView = ({ block }: { block: ProseBlock }) => {
  if (block.kind === "heading") {
    return <h2 className="text-foreground mt-4 text-lg">{block.text}</h2>;
  }
  if (block.kind === "list") {
    return (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {block.items.map((item) => (
          <ProseItem key={item.label} item={item} />
        ))}
      </ul>
    );
  }
  return <p>{withInlineCode(block.text)}</p>;
};

export const ProsePageView = ({ page, children }: { page: ProsePage; children?: ReactNode }) => (
  <main className="flex min-h-[calc(100dvh-(--spacing(32)))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
    <h1 className="text-3xl leading-snug lg:text-4xl">{page.heading}</h1>
    <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 leading-relaxed">
      {page.blocks.map((block, index) => (
        <ProseBlockView key={index} block={block} />
      ))}
      {children}
    </div>
  </main>
);
