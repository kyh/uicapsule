"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toast";
import { mcpInstallPrompt } from "@/lib/agent/mcp-install-prompt";

export const CopyPromptButton = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mcpInstallPrompt);
    } catch (error) {
      console.error("Failed to copy MCP install prompt:", error);
      toast.error("Failed to copy the install prompt.");

      return;
    }

    setCopied(true);
  };

  return (
    <Button size="lg" className="px-4" onClick={copy}>
      {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      Copy install prompt
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </Button>
  );
};
