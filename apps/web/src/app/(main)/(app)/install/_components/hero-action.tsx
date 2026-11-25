"use client";

import { useEffect, useState } from "react";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toast";

import type { InstallGuide } from "@/lib/agent/site-pages";

const CopyActionButton = ({ label, value }: { label: string; value: string }) => {
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
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error(`Failed to copy "${label}":`, error);
      toast.error("Couldn't copy to the clipboard.");

      return;
    }

    setCopied(true);
  };

  return (
    <Button size="lg" className="px-4" onClick={copy}>
      {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      {label}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </Button>
  );
};

export const HeroAction = ({ action }: { action: InstallGuide["action"] }) =>
  action.kind === "copy" ? (
    <CopyActionButton label={action.label} value={action.value} />
  ) : (
    <a
      href={action.href}
      target="_blank"
      rel="noreferrer"
      className={buttonVariants({ className: "px-4", size: "lg" })}
    >
      {action.label}
      <ArrowUpRightIcon aria-hidden="true" />
    </a>
  );
