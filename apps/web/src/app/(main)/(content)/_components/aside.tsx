"use client";

import { isLocalContentComponent } from "@/lib/content/content-schema";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import { toast } from "@repo/ui/components/sonner";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "@repo/ui/lib/utils";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import JSZip from "jszip";
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

import type { ContentComponentSummary, SourceFile } from "@/lib/content/content-schema";
import { CodePreview } from "./code-preview";

const FLOATING_BUTTON_CLASS = "size-9 rounded-full shadow-sm";
const SECTION_CLASS = "-mx-3 flex flex-col gap-2.5 border-t px-3 pt-3 pb-1";

const sourceFilesQuery = (slug: string) =>
  queryOptions({
    queryKey: ["content-source-files", slug],
    queryFn: async (): Promise<SourceFile[]> => {
      const res = await fetch(`/api/content/${slug}`);
      if (!res.ok) throw new Error(`Failed to load source files for ${slug}`);
      return (await res.json()) as SourceFile[];
    },
  });

type AsideProps = {
  contentComponent: ContentComponentSummary;
};

type ResponsiveAsideProps = AsideProps & {
  onPrev?: () => void;
  onNext?: () => void;
};

const COPIED_RESET_DELAY = 2000;

const Aside = ({ contentComponent }: AsideProps) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isLocalContentComponent(contentComponent)) return;
    void queryClient.prefetchQuery(sourceFilesQuery(contentComponent.slug));
  }, [contentComponent, queryClient]);

  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  const handleInstallClick = async () => {
    if (!isLocalContentComponent(contentComponent) || copied) return;

    const command = `npx shadcn@latest add @uicapsule/${contentComponent.slug}`;

    try {
      await navigator.clipboard.writeText(command);
    } catch (err) {
      console.error("Failed to copy command to clipboard:", err);
      toast.error("Failed to copy command to clipboard.", {
        description: (
          <code className="bg-muted mt-1 block rounded p-2 font-[monospace]">{command}</code>
        ),
      });
      return;
    }

    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY);

    toast(
      <code className="bg-muted block rounded p-2 font-[monospace]">{command}</code>,
      { icon: <ClipboardCheckIcon className="size-4" /> },
    );
  };

  const handleDownloadClick = async () => {
    if (!isLocalContentComponent(contentComponent)) return;

    const toastId = toast.loading("Download started", {
      icon: <DownloadIcon className="size-4" />,
      description: `${contentComponent.slug}.zip is being downloaded`,
    });
    try {
      const sourceFiles = await queryClient.fetchQuery(sourceFilesQuery(contentComponent.slug));

      const zip = new JSZip();
      for (const { path, code } of sourceFiles) {
        const cleanPath = path.startsWith("/") ? path.slice(1) : path;
        zip.file(cleanPath, code);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${contentComponent.slug}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download completed", {
        icon: <CheckIcon className="size-4" />,
        description: `${contentComponent.slug}.zip has been downloaded`,
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
      {isLocalContentComponent(contentComponent) ? (
        <Drawer>
          <div className="flex flex-col gap-1.5">
            <div className="flex rounded-full shadow-xs">
              <DrawerTrigger
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "flex-1 rounded-none rounded-s-full border-e-0 pl-12 shadow-none focus-visible:z-10",
                })}
              >
                View Source
              </DrawerTrigger>
              <Button
                variant="outline"
                className="rounded-none rounded-e-full shadow-none focus-visible:z-10"
                onClick={handleDownloadClick}
              >
                <span className="sr-only">Download</span>
                <DownloadIcon className="size-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <motion.button
                layout
                className={cn(
                  "text-muted-foreground flex items-center gap-1 text-xs underline decoration-dotted transition-colors",
                  copied && "text-primary decoration-transparent",
                )}
                onClick={() => void handleInstallClick()}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={copied ? "copied" : "install"}
                    layout="position"
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
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
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                              delay: 0.1,
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
              </motion.button>
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
            render={<a href={contentComponent.sourceUrl} target="_blank" rel="noreferrer" />}
            nativeButton={false}
            variant="outline"
            className="w-full rounded-full shadow-none focus-visible:z-10"
          >
            View Source on GitHub
          </Button>
          <span className="text-muted-foreground text-center text-xs">Opens in a new tab</span>
        </div>
      )}
      {contentComponent.asSeenOn && (
        <div className={SECTION_CLASS}>
          <h2>As seen on</h2>
          <div className="flex flex-wrap gap-2">
            {contentComponent.asSeenOn.map((item) => (
              <a
                href={item.url}
                key={item.name}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
      {contentComponent.tags && (
        <div className={SECTION_CLASS}>
          <h2>Tags</h2>
          <div className="flex flex-wrap gap-2">
            {contentComponent.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {contentComponent.authors && (
        <div className={SECTION_CLASS}>
          <h2>Author</h2>
          <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
            {contentComponent.authors.map((author) => (
              <a href={author.url} key={author.name} target="_blank">
                <Avatar>
                  <AvatarImage src={author.url} />
                  <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const SourceCodePreview = ({ slug }: { slug: string }) => {
  const { data: sourceFiles } = useSuspenseQuery(sourceFilesQuery(slug));
  return <CodePreview sourceFiles={sourceFiles} />;
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
          <Aside contentComponent={contentComponent} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
