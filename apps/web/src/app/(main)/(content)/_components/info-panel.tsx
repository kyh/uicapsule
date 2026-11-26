"use client";

import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { cn } from "cn";

import { tagLabel } from "@/lib/content/content-categories";
import type { ContentComponentSummary } from "@/lib/content/content-schema";
import { InstallTabs } from "./install-tabs";
import { PersonAvatar } from "./person-avatar";

const LINK_CLASS =
  "text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors";

const formatAddedAt = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

const SECTION_CLASS = "flex flex-col gap-2 border-b px-4 py-4";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className={SECTION_CLASS}>
    <h2 className="text-muted-foreground text-xs font-medium">{title}</h2>
    {children}
  </section>
);

export const InfoPanel = ({ component }: { component: ContentComponentSummary }) => (
  <div className="flex flex-col">
    <header className="flex flex-col gap-1 border-b px-4 py-4">
      <h1 className="text-lg font-medium select-text">{component.name}</h1>
      <p className="text-muted-foreground text-sm text-pretty select-text">
        {component.description}
      </p>
    </header>
    {component.type === "local" ? (
      <InstallTabs slug={component.slug} className={SECTION_CLASS} />
    ) : (
      <Section title="Source">
        <a
          href={component.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(LINK_CLASS, "flex items-center gap-1 text-sm")}
        >
          View source on GitHub
          <ExternalLinkIcon className="size-3.5" />
        </a>
      </Section>
    )}
    <Section title="Tags">
      <div className="flex flex-wrap gap-1.5">
        {component.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tagLabel(tag)}
          </Badge>
        ))}
      </div>
    </Section>
    {component.authors && (
      <Section title="Author">
        <ul className="flex flex-col gap-2 text-sm select-text">
          {component.authors.map((author) => (
            <li key={author.url} className="flex items-center gap-2">
              <PersonAvatar person={author} />
              <a href={author.url} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                {author.name}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    )}
    {component.inspiredBy && (
      <Section title="Inspired by">
        <ul className="flex flex-col gap-1 text-xs select-text">
          {component.inspiredBy.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                {link.label}
                <ExternalLinkIcon className="size-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    )}
    {component.requestedBy && (
      <Section title="Requested by">
        <div className="flex items-center gap-2 text-sm select-text">
          <PersonAvatar person={component.requestedBy} />
          <a
            href={component.requestedBy.url}
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASS}
          >
            {component.requestedBy.name}
          </a>
        </div>
      </Section>
    )}
    <p className="text-muted-foreground px-4 py-3 text-xs select-text">
      Added <time dateTime={component.addedAt}>{formatAddedAt(component.addedAt)}</time>
    </p>
  </div>
);

const PAGER = {
  next: { Icon: ArrowRightIcon, label: "Next", shortcut: "j" },
  prev: { Icon: ArrowLeftIcon, label: "Previous", shortcut: "k" },
} as const;

interface PagerButtonProps {
  direction: keyof typeof PAGER;
  component: ContentComponentSummary | undefined;
  onSelect: (slug: string) => void;
}

const PagerButton = ({ direction, component, onSelect }: PagerButtonProps) => {
  const { Icon, label, shortcut } = PAGER[direction];
  const icon = <Icon />;

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!component}
      aria-label={component ? `${label}: ${component.name}` : label}
      aria-keyshortcuts={shortcut}
      className={cn(
        "text-muted-foreground hover:text-foreground max-w-full min-w-0 rounded-md font-normal",
        direction === "prev" ? "justify-self-start" : "justify-self-end",
      )}
      onClick={() => {
        if (component) {
          onSelect(component.slug);
        }
      }}
    >
      {direction === "prev" && icon}
      <span className="truncate">{component?.name ?? label}</span>
      {direction === "next" && icon}
    </Button>
  );
};

interface InfoPagerProps {
  prev: ContentComponentSummary | undefined;
  next: ContentComponentSummary | undefined;
  onSelect: (slug: string) => void;
}

export const InfoPager = ({ prev, next, onSelect }: InfoPagerProps) => (
  <nav
    aria-label="Browse components"
    className="grid h-12 shrink-0 grid-cols-2 items-center gap-1 border-t px-2"
  >
    <PagerButton direction="prev" component={prev} onSelect={onSelect} />
    <PagerButton direction="next" component={next} onSelect={onSelect} />
  </nav>
);
