"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { CopyButton } from "@repo/ui/components/copy-button";
import { Tabs, TabsIndicator, TabsList, TabsContent, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toast";

import { mcpComponentPrompt, mcpInstallPath } from "@/lib/agent/mcp-install-prompt";
import { downloadZip, installCommand, sourceFilesQuery } from "./source-files";

const TABS = [
  { label: "Install", value: "install" },
  { label: "Download", value: "download" },
  { label: "Prompt", value: "prompt" },
] as const;

const MONO_CLASS =
  "min-w-0 flex-1 overflow-x-auto font-[monospace] text-xs whitespace-nowrap select-text [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]";

const Field = ({ children, action }: { children: ReactNode; action: ReactNode }) => (
  <div className="bg-muted/40 flex h-10 items-center gap-2 rounded-lg border pr-1 pl-3">
    {children}
    {action}
  </div>
);

const InstallField = ({ slug }: { slug: string }) => (
  <Field
    action={
      <CopyButton
        label="Copy install command"
        value={installCommand(slug)}
        className="size-8"
        onCopy={() => {
          toast.success("Copied to clipboard");
        }}
        onError={() => {
          toast.error("Failed to copy command to clipboard.");
        }}
      />
    }
  >
    <code className={MONO_CLASS}>{installCommand(slug)}</code>
  </Field>
);

const DownloadField = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();

  const download = useMutation({
    mutationFn: async () => {
      await downloadZip(slug, await queryClient.query(sourceFilesQuery(slug)));
    },
    onError: (error) => {
      console.error("Failed to create zip file:", error);
      toast.error("Failed to create zip file", { description: "Please try again later" });
    },
    onSuccess: () => {
      toast.success(`${slug}.zip downloaded`);
    },
  });

  return (
    <Field
      action={
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Download ${slug}.zip`}
          loading={download.isPending}
          className="text-muted-foreground size-8"
          onClick={() => {
            download.mutate();
          }}
        >
          <DownloadIcon className="size-3.5" />
        </Button>
      }
    >
      <code className={MONO_CLASS}>{slug}.zip</code>
    </Field>
  );
};

const PromptField = ({ slug }: { slug: string }) => (
  <Field
    action={
      <CopyButton
        label="Copy prompt"
        value={mcpComponentPrompt(slug)}
        className="size-8"
        onCopy={() => {
          toast.success("Copied prompt");
        }}
        onError={() => {
          toast.error("Failed to copy prompt to clipboard.");
        }}
      />
    }
  >
    <p className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
      Fetches it via the{" "}
      <Link
        href={mcpInstallPath}
        className="hover:text-primary underline decoration-dotted underline-offset-4 transition-colors"
      >
        MCP server
      </Link>
    </p>
  </Field>
);

export const InstallTabs = ({ slug, className }: { slug: string; className?: string }) => (
  <Tabs defaultValue="install" render={<section />} className={className}>
    <TabsList aria-label="Get the code" className="-ml-2 h-6 gap-0.5 bg-transparent p-0">
      <TabsIndicator className="bg-accent rounded-md shadow-none" />
      {TABS.map(({ label, value }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="text-muted-foreground data-active:text-foreground not-data-active:hover:text-primary h-6 flex-none px-2 text-xs font-medium transition-colors"
        >
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
    <TabsContent value="install">
      <InstallField slug={slug} />
    </TabsContent>
    <TabsContent value="download">
      <DownloadField slug={slug} />
    </TabsContent>
    <TabsContent value="prompt">
      <PromptField slug={slug} />
    </TabsContent>
  </Tabs>
);
