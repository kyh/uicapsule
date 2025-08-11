"use client";

import Link from "next/link";
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
import { useMediaQuery } from "@repo/ui/utils";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  InfoIcon,
} from "lucide-react";

import type { ContentComponent } from "@/lib/content";
import { SandpackCodeEditor, SandpackFileExplorer } from "./sandpack";

type AsideProps = {
  contentComponent: ContentComponent;
};

const Aside = ({ contentComponent }: AsideProps) => {
  const sectionClassname =
    "-mx-3 flex flex-col gap-2.5 border-t px-3 pt-3 pb-1";

  const handleInstallClick = () => {
    const command = `npx shadcn@latest add https://uicapsule.com/registry/${contentComponent.slug}.json`;

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

  return (
    <Card className="h-full">
      <h1 className="text-xl">{contentComponent.name}</h1>
      <p className="text-muted-foreground text-sm">
        {contentComponent.description}
      </p>
      <Drawer>
        <div className="flex flex-col gap-1.5">
          <DrawerTrigger className={buttonVariants({ variant: "outline" })}>
            View Source
          </DrawerTrigger>
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
          <div className="mt-4 flex h-[90dvh] overflow-auto border-t">
            <SandpackFileExplorer />
            <SandpackCodeEditor showLineNumbers showInlineErrors wrapContent />
          </div>
        </DrawerContent>
      </Drawer>
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
      {contentComponent.dependencies && (
        <div className={sectionClassname}>
          <h2>Packages</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(contentComponent.dependencies).map((dep) => (
              <Badge key={dep} variant="secondary">
                {dep}
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
                  <AvatarImage src={author.avatarUrl} />
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
  const isDesktop = useMediaQuery();

  if (isDesktop)
    return (
      <aside className="absolute right-0 z-10 h-full w-80 pr-6 pb-13">
        <Aside contentComponent={contentComponent} />
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
