import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "./button";
import { Icon } from "./icon";

/** Copies `value` to the clipboard and swaps its glyph for a tick briefly. */
export const CopyButton = ({ value, label = "Copy" }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1400);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }

    setCopied(true);
  };

  return (
    <Button
      aria-label={copied ? "Copied" : label}
      onClick={copy}
      size="icon-sm"
      title={copied ? "Copied" : label}
      variant="ghost"
    >
      <Icon icon={copied ? Check : Copy} />
      <span aria-live="polite" className="hx-sr">
        {copied ? "Copied" : ""}
      </span>
    </Button>
  );
};
