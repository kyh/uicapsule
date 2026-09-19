"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { ButtonGroup } from "@repo/ui/components/button-group";
import { Card } from "@repo/ui/components/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import { toast } from "@repo/ui/components/toast";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "cn";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  InfoIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useEffect, useRef, useState } from "react";

import { tagLabel } from "@/lib/content/content-categories";
import type { ContentComponentSummary, SourceFile } from "@/lib/content/content-schema";
import dynamic from "next/dynamic";

import { PersonAvatar } from "./person-avatar";

const CodePreview = dynamic(async () => {
  const mod = await import("./code-preview");
  return mod.CodePreview;
});

const FLOATING_BUTTON_CLASS = "size-9 rounded-full shadow-sm";
const SECTION_CLASS = "-mx-3 flex flex-col gap-2.5 border-t px-3 pt-3 pb-1";
const AVATAR_ROW_CLASS =
  "*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale";

const sourceFilesSchema = z.array(z.object({ code: z.string(), path: z.string() }));

const sourceFilesQuery = (slug: string) =>
  queryOptions({
    queryFn: async (): Promise<SourceFile[]> => {
      const res = await fetch(`/api/content/${slug}`);
      if (!res.ok) {
        throw new Error(`Failed to load source files for ${slug}`);
      }
      return sourceFilesSchema.parse(await res.json());
    },
    queryKey: ["content-source-files", slug],
  });

interface AsideProps {
  contentComponent: ContentComponentSummary;
}

type ResponsiveAsideProps = AsideProps & {
  onPrev?: () => void;
  onNext?: () => void;
};

const COPIED_RESET_DELAY = 2000;

const formatAddedAt = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

const downloadZip = async (slug: string, sourceFiles: SourceFile[]) => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const { path, code } of sourceFiles) {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    zip.file(cleanPath, code);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const SourceCodePreview = ({ slug }: { slug: string }) => {
  const { data: sourceFiles } = useSuspenseQuery(sourceFilesQuery(slug));
  return <CodePreview key={slug} sourceFiles={sourceFiles} />;
};

const Aside = ({ contentComponent }: AsideProps) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (contentComponent.type !== "local") {
      return;
    }
    void queryClient.prefetchQuery(sourceFilesQuery(contentComponent.slug));
  }, [contentComponent, queryClient]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    },
    [],
  );

  const handleInstallClick = async () => {
    if (contentComponent.type !== "local" || copied) {
      return;
    }

    const command = `npx shadcn@latest add @uicapsule/${contentComponent.slug}`;
    // Always wider than the toast; the fade signals overflow without a scrollbar.
    const snippet = (
      <code className="bg-muted block rounded px-2 py-1.5 font-[monospace]">
        <span className="block overflow-x-auto whitespace-nowrap [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] [scrollbar-width:none]">
          {command}
        </span>
      </code>
    );

    try {
      await navigator.clipboard.writeText(command);
    } catch (error) {
      console.error("Failed to copy command to clipboard:", error);
      toast.error("Failed to copy command to clipboard.", { description: snippet });
      return;
    }

    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY);

    toast("Copied to clipboard", {
      description: snippet,
      icon: <ClipboardCheckIcon className="size-4" />,
    });
  };

  const handleDownloadClick = async () => {
    if (contentComponent.type !== "local") {
      return;
    }

    const toastId = toast.loading("Download started", {
      description: `${contentComponent.slug}.zip is being downloaded`,
      icon: <DownloadIcon className="size-4" />,
    });
    try {
      const sourceFiles = await queryClient.fetchQuery(sourceFilesQuery(contentComponent.slug));
      await downloadZip(contentComponent.slug, sourceFiles);

      toast.success("Download completed", {
        description: `${contentComponent.slug}.zip has been downloaded`,
        icon: <CheckIcon className="size-4" />,
        id: toastId,
      });
    } catch (error) {
      console.error("Failed to create zip file:", error);
      toast.error("Failed to create zip file", {
        description: "Please try again later",
        id: toastId,
      });
    }
  };

  return (
    <Card className="h-full">
      <h1 className="flex items-center gap-1 text-xl">{contentComponent.name}</h1>
      {contentComponent.description && (
        <p className="text-muted-foreground text-sm">{contentComponent.description}</p>
      )}
      {contentComponent.type === "local" ? (
        <Drawer>
          <div className="flex flex-col gap-1.5">
            <ButtonGroup className="w-full shadow-xs">
              <DrawerTrigger
                className={buttonVariants({
                  className: "flex-1 pl-12 shadow-none",
                  variant: "outline",
                })}
              >
                View Source
              </DrawerTrigger>
              <Button variant="outline" className="shadow-none" onClick={handleDownloadClick}>
                <span className="sr-only">Download</span>
                <DownloadIcon className="size-4" />
              </Button>
            </ButtonGroup>
            <div className="flex justify-center">
              <button
                type="button"
                aria-label={copied ? "Copied to clipboard" : "Copy the shadcn install command"}
                className="text-muted-foreground grid text-xs"
                onClick={handleInstallClick}
              >
                <AnimatePresence initial={false}>
                  <motion.span
                    key={copied ? "copied" : "install"}
                    className={cn(
                      "col-start-1 row-start-1 flex items-center justify-center gap-1 underline decoration-dotted",
                      copied && "text-primary decoration-transparent",
                    )}
                    initial={{ filter: "blur(4px)", opacity: 0 }}
                    animate={{ filter: "blur(0px)", opacity: 1 }}
                    exit={{ filter: "blur(4px)", opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {copied ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                          className="size-3.5"
                        >
                          <motion.path
                            d="M4 12l5 5L20 6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                              damping: 25,
                              delay: 0.1,
                              stiffness: 300,
                              type: "spring",
                            }}
                          />
                        </svg>
                        Copied to clipboard
                      </>
                    ) : (
                      "Install via shadcn CLI"
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>
          <DrawerContent className="border-border bg-background text-sm">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Source Code</DrawerTitle>
              <DrawerDescription>Component source code</DrawerDescription>
            </DrawerHeader>
            <Suspense
              fallback={
                <div className="text-muted-foreground p-6 text-sm">Loading source files…</div>
              }
            >
              <SourceCodePreview slug={contentComponent.slug} />
            </Suspense>
          </DrawerContent>
        </Drawer>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <Button
            render={
              // oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- Base UI render prop; the Button's children become the anchor's content
              <a href={contentComponent.sourceUrl} target="_blank" rel="noreferrer" />
            }
            nativeButton={false}
            variant="outline"
            className="w-full shadow-xs"
          >
            View Source on GitHub
          </Button>
          <span className="text-muted-foreground text-center text-xs">Opens in a new tab</span>
        </div>
      )}
      <div className={SECTION_CLASS}>
        <h2>Tags</h2>
        <div className="flex flex-wrap gap-2">
          {contentComponent.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tagLabel(tag)}
            </Badge>
          ))}
        </div>
      </div>
      {contentComponent.authors && (
        <div className={SECTION_CLASS}>
          <h2>Author</h2>
          <div className={AVATAR_ROW_CLASS}>
            {contentComponent.authors.map((author) => (
              <PersonAvatar key={author.url} person={author} />
            ))}
          </div>
        </div>
      )}
      {contentComponent.inspiredBy && (
        <div className={SECTION_CLASS}>
          <h2>Inspired by</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {contentComponent.inspiredBy.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary underline decoration-dotted transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {contentComponent.requestedBy && (
        <div className={SECTION_CLASS}>
          <h2>Requested by</h2>
          <div className="flex items-center gap-2 text-sm">
            <PersonAvatar person={contentComponent.requestedBy} />
            <a
              href={contentComponent.requestedBy.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary underline decoration-dotted transition-colors"
            >
              {contentComponent.requestedBy.name}
            </a>
          </div>
        </div>
      )}
      <p className="text-muted-foreground -mx-3 border-t px-3 pt-3 text-xs">
        Added{" "}
        <time dateTime={contentComponent.addedAt}>{formatAddedAt(contentComponent.addedAt)}</time>
      </p>
    </Card>
  );
};

export const ResponsiveAside = ({ contentComponent, onPrev, onNext }: ResponsiveAsideProps) => {
  const isDesktop = useMediaQuery();
  const direction = isDesktop ? "right" : "bottom";

  return (
    <Drawer direction={direction}>
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2 sm:top-1/2 sm:right-6 sm:bottom-auto sm:-translate-y-1/2">
        <Button
          variant="secondary"
          size="icon"
          className={FLOATING_BUTTON_CLASS}
          onClick={onPrev}
          disabled={!onPrev}
        >
          <ChevronUpIcon className="size-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <DrawerTrigger asChild>
          <Button variant="secondary" size="icon" className={FLOATING_BUTTON_CLASS}>
            <InfoIcon className="size-4" />
            <span className="sr-only">Info</span>
          </Button>
        </DrawerTrigger>
        <Button
          variant="secondary"
          size="icon"
          className={FLOATING_BUTTON_CLASS}
          onClick={onNext}
          disabled={!onNext}
        >
          <ChevronDownIcon className="size-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Component info</DrawerTitle>
          <DrawerDescription>Component details</DrawerDescription>
        </DrawerHeader>
        <div className={cn(isDesktop ? "h-full [&_[data-slot=card]]:h-full" : "pt-5")}>
          <Aside key={contentComponent.slug} contentComponent={contentComponent} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
