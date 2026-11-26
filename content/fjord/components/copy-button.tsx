import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "./button";
import { Icon } from "./icon";

const noop = () => null;

const writeClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);

    return true;
  } catch {
    const area = document.createElement("textarea");

    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();

    // oxlint-disable-next-line typescript/no-deprecated -- the only copy path left when the clipboard API is blocked in a sandboxed frame
    const done = document.execCommand("copy");

    area.remove();

    return done;
  }
};

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: "icon-sm" | "icon-xs" | "sm";
  showLabel?: boolean;
}

/** Copies a value and says so for 1.6 seconds. The glyph swaps with a cut, never a tween. */
export const CopyButton = ({
  value,
  label = "Copy",
  size = "icon-sm",
  showLabel,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return noop;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const copy = async () => {
    const done = await writeClipboard(value);

    setCopied(done);
  };

  const visibleLabel = copied ? "Copied" : label;

  return (
    <>
      <Button
        aria-label={showLabel === true ? undefined : label}
        onClick={() => {
          void copy();
        }}
        size={showLabel === true ? "sm" : size}
        variant={showLabel === true ? "secondary" : "ghost"}
      >
        <Icon icon={copied ? Check : Copy} />
        {showLabel === true ? visibleLabel : null}
      </Button>
      <output className="fj-sr">{copied ? "Copied" : ""}</output>
    </>
  );
};
