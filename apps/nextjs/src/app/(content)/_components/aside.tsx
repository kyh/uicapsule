"use client";

import { useState } from "react";
import Link from "next/link";
import {
  isLocalContentComponent,
  isRemoteContentComponent,
} from "@repo/api/content/content-schema";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button, buttonVariants } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import { toast } from "@repo/ui/toast";
import { cn, useMediaQuery } from "@repo/ui/utils";
import JSZip from "jszip";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  InfoIcon,
} from "lucide-react";

import type { ContentComponent } from "@repo/api/content/content-schema";
import { CodePreview } from "./code-preview";

type AsideProps = {
  contentComponent: ContentComponent;
};

const Aside = ({ contentComponent }: AsideProps) => {
  const sectionClassname =
    "-mx-3 flex flex-col gap-2.5 border-t px-3 pt-3 pb-1";

  const handleInstallClick = () => {
    if (!isLocalContentComponent(contentComponent)) {
      return;
    }

    const command = `npx shadcn@latest add https://uicapsule.com/r/${contentComponent.slug}.json`;

    navigator.clipboard.writeText(command).catch((err) => {
      console.error("Failed to copy command to clipboard:", err);
      toast.error("Failed to copy command to clipboard.", {
        description: (
          <code className="bg-muted mt-1 block rounded p-2 font-[monospace]">
            {command}
          </code>
        ),
      });
    });

    toast(
      <div className="flex items-center gap-1">
        <ClipboardCheckIcon className="size-4" />
        Installation command copied to clipboard
      </div>,
      {
        description: (
          <code className="bg-muted mt-1 block rounded p-2 font-[monospace]">
            {command}
          </code>
        ),
      },
    );
  };

  const handleDownloadClick = async () => {
    if (!isLocalContentComponent(contentComponent)) {
      return;
    }

    const toastId = toast.loading("Download started", {
      icon: <DownloadIcon className="size-4" />,
      description: `${contentComponent.slug}.zip is being downloaded`,
    });
    try {
      const zip = new JSZip();

      // Add all source files to the zip
      Object.entries(contentComponent.sourceCode).forEach(
        ([filePath, content]) => {
          // Remove leading slash from filePath for cleaner zip structure
          const cleanPath = filePath.startsWith("/")
            ? filePath.slice(1)
            : filePath;
          zip.file(cleanPath, content);
        },
      );

      // Add preview.tsx if it exists
      if (contentComponent.previewCode) {
        zip.file("preview.tsx", contentComponent.previewCode);
      }

      // Add package.json if dependencies exist
      if (contentComponent.dependencies || contentComponent.devDependencies) {
        const packageJson = {
          name: contentComponent.slug,
          version: "0.1.0",
          private: true,
          ...(contentComponent.dependencies && {
            dependencies: contentComponent.dependencies,
          }),
          ...(contentComponent.devDependencies && {
            devDependencies: contentComponent.devDependencies,
          }),
        };
        zip.file("package.json", JSON.stringify(packageJson, null, 2));
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
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
      <h1 className="flex items-center gap-1 text-xl">
        {contentComponent.name}
        {/* {isLocalContentComponent(contentComponent) && (
          <OpenInCodeSandboxButton />
        )} */}
      </h1>
      {contentComponent.description && (
        <p className="text-muted-foreground text-sm">
          {contentComponent.description}
        </p>
      )}
      {isLocalContentComponent(contentComponent) ? (
        <Drawer>
          <div className="flex flex-col gap-1.5">
            <div className="flex -space-x-px rounded-full shadow-xs">
              <DrawerTrigger
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "flex-1 rounded-none rounded-s-full pl-12 shadow-none focus-visible:z-10",
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
            <span className="text-muted-foreground text-center text-xs">
              <button
                className="cursor-pointer underline decoration-dotted"
                onClick={handleInstallClick}
              >
                Install via shadcn CLI
              </button>
            </span>
          </div>
          <DrawerContent className="border-border bg-background text-sm">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Source Code</DrawerTitle>
              <DrawerDescription>Component source code</DrawerDescription>
            </DrawerHeader>
            <CodePreview contentComponent={contentComponent} />
          </DrawerContent>
        </Drawer>
      ) : (
        isRemoteContentComponent(contentComponent) && (
          <div className="flex flex-col items-center gap-1.5">
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full shadow-none focus-visible:z-10"
            >
              <a
                href={contentComponent.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                View Source on GitHub
              </a>
            </Button>
            <span className="text-muted-foreground text-center text-xs">
              Opens in a new tab
            </span>
          </div>
        )
      )}
      {contentComponent.asSeenOn && (
        <div className={sectionClassname}>
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
        <div className={sectionClassname}>
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
        <div className={sectionClassname}>
          <h2>Author</h2>
          <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
            {contentComponent.authors.map((author) => (
              <a href={author.url} key={author.name} target="_blank">
                <Avatar key={author.name}>
                  <AvatarImage src={author.url} />
                  <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="text-muted-foreground/70 -mx-3 mt-auto -mb-3 flex justify-between gap-4 border-t px-3 py-3">
        {contentComponent.previousSlug ? (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/ui/${contentComponent.previousSlug}`}>
              <ArrowLeftIcon className="size-4" />
              <span className="sr-only">Previous</span>
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {contentComponent.nextSlug ? (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/ui/${contentComponent.nextSlug}`}>
              <span className="sr-only">Next</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </Card>
  );
};

export const ResponsiveAside = ({ contentComponent }: AsideProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDesktop = useMediaQuery();

  if (isDesktop)
    return (
      <aside
        className={cn(
          "absolute right-0 z-10 h-full w-80 pr-6 pb-13",
          !isOpen && "pointer-events-none",
        )}
      >
        <Button
          className={cn(
            "absolute top-4 right-8 z-10 size-5",
            !isOpen && "pointer-events-auto",
          )}
          variant="secondary"
          size="icon"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <InfoIcon className="text-muted-foreground size-4" />
        </Button>
        {isOpen && <Aside contentComponent={contentComponent} />}
      </aside>
    );

  return (
    <div className="absolute top-2 right-4">
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="size-7" variant="secondary" size="icon">
            <InfoIcon className="text-muted-foreground size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Settings options</DrawerDescription>
          </DrawerHeader>
          <div className="pt-5">
            <Aside contentComponent={contentComponent} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
