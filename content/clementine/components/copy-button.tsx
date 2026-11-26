import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import "./copy-button.css";

export const CopyButton = ({ value, label = "Copy" }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const reset = window.setTimeout(() => setCopied(false), 1600);

    return () => window.clearTimeout(reset);
  }, [copied]);

  return (
    <button
      aria-label={`${label}: ${value}`}
      className="cl-btn cl-copy"
      data-copied={copied || undefined}
      data-size="sm"
      data-variant="secondary"
      onClick={() => {
        void navigator.clipboard
          ?.writeText(value)
          .then(() => setCopied(true))
          .catch(() => setCopied(false));
      }}
      type="button"
    >
      <span className="cl-btn__body">
        <span className="cl-copy__icons" aria-hidden>
          <Copy size={14} strokeWidth={1.75} />
          <Check size={14} strokeWidth={2.25} />
        </span>
        {label}
        <span aria-live="polite" className="cl-sr">
          {copied ? "Copied" : ""}
        </span>
      </span>
    </button>
  );
};
