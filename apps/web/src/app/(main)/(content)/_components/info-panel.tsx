"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { toast } from "@repo/ui/components/toast";
import { cn } from "cn";

import { tagLabel } from "@/lib/content/content-categories";
import type { ContentComponentSummary } from "@/lib/content/content-schema";
import { PersonAvatar } from "./person-avatar";
import { installCommand } from "./source-files";

const COPIED_RESET_DELAY = 2000;

const LINK_CLASS =
  "text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors";

const formatAddedAt = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2.5">
    <h2 className="text-muted-foreground text-xs font-medium">{title}</h2>
    {children}
  </section>
);

export const useCopyInstall = (slug: string) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand(slug));
    } catch (error) {
      console.error("Failed to copy command to clipboard:", error);
      toast.error("Failed to copy command to clipboard.");

      return;
    }

    setCopied(true);
    toast.success("Install command copied");

    if (timer.current !== null) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY);
  };

  return { copied, copy };
};

const InstallCommand = ({ slug }: { slug: string }) => {
  const { copied, copy } = useCopyInstall(slug);

  return (
    <div className="bg-muted/40 flex h-10 items-center gap-2 rounded-lg border pr-1 pl-3">
      <code className="min-w-0 flex-1 overflow-x-auto font-[monospace] text-xs whitespace-nowrap select-text [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]">
        {installCommand(slug)}
      </code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy install command"}
        className="text-muted-foreground hover:text-foreground hover:bg-accent grid size-7 shrink-0 place-items-center rounded-md transition-colors"
        onClick={copy}
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      </button>
    </div>
  );
};

export const InfoPanel = ({ component }: { component: ContentComponentSummary }) => (
  <div className="flex flex-col gap-7 p-5 md:p-6">
    <header className="flex flex-col gap-1.5">
      <h1 className="text-lg font-medium select-text">{component.name}</h1>
      <p className="text-muted-foreground text-sm text-pretty select-text">
        {component.description}
      </p>
    </header>
    {component.type === "local" ? (
      <Section title="Install">
        <InstallCommand slug={component.slug} />
      </Section>
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
        <ul className="flex flex-col gap-1.5 text-sm select-text">
          {component.inspiredBy.map((link) => (
            <li key={link.url} className="flex items-start gap-2">
              <CheckIcon className="text-primary mt-0.5 size-3.5 shrink-0" />
              <a href={link.url} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                {link.label}
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
    <p className="text-muted-foreground border-t pt-4 text-xs select-text">
      Added <time dateTime={component.addedAt}>{formatAddedAt(component.addedAt)}</time>
    </p>
  </div>
);
