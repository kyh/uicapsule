"use client";

import { useEffect, useState } from "react";
import { BlocksIcon, CheckIcon, CopyIcon, SparklesIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { toast } from "@repo/ui/components/toast";
import {
  mcpClaudeCodeCommand,
  mcpConfigJson,
  mcpInstallPrompt,
} from "@/lib/agent/mcp-install-prompt";

const useCopy = (text: string, label: string) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 1500);

    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      toast.error(`Failed to copy ${label}.`);

      return;
    }

    setCopied(true);
  };

  return { copied, copy };
};

const CopyBlock = ({ label, text }: { label: string; text: string }) => {
  const { copied, copy } = useCopy(text, label);

  return (
    <div className="bg-muted/50 relative rounded-lg border">
      <pre className="overflow-x-auto py-3 pr-12 pl-3 font-mono text-xs leading-relaxed">
        <code>{text}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-1.5 right-1.5"
        aria-label={copied ? "Copied" : `Copy ${label}`}
        onClick={copy}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
};

const jobs = [
  {
    description: "Skills for motion, gestures, accessibility, typography, color and layout.",
    icon: SparklesIcon,
    title: "Build better UI",
  },
  {
    description:
      "search_components and get_component find a component by what it does and return its source.",
    icon: BlocksIcon,
    title: "Start from a component",
  },
];

const PromptButton = () => {
  const { copied, copy } = useCopy(mcpInstallPrompt, "MCP install prompt");

  return (
    <Button variant="outline" onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy prompt for your agent"}
    </Button>
  );
};

export const McpInstallDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Install the MCP server</DialogTitle>
        <DialogDescription>One server, two jobs for your agent.</DialogDescription>
      </DialogHeader>
      <ul className="grid gap-3">
        {jobs.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-3">
            <Icon aria-hidden="true" className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="grid gap-0.5">
              <span className="font-medium">{title}</span>
              <span className="text-muted-foreground">{description}</span>
            </div>
          </li>
        ))}
      </ul>
      <section className="grid min-w-0 gap-2">
        <h3 className="font-medium">Claude Code</h3>
        <CopyBlock label="Claude Code command" text={mcpClaudeCodeCommand} />
      </section>
      <section className="grid min-w-0 gap-2">
        <h3 className="font-medium">Other clients</h3>
        <p className="text-muted-foreground">
          Add it to your MCP config. It uses Streamable HTTP and needs no authentication.
        </p>
        <CopyBlock label="MCP config" text={mcpConfigJson} />
      </section>
      <DialogFooter>
        <PromptButton />
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
