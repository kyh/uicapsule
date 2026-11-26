"use client";

import { Check, Copy } from "lucide-react";

import { useCopy } from "../lib/hooks";
import { Button } from "./button";

/** Copies a value; the glyph turns to a tick and a status region says so. */
export const CopyButton = ({
  value,
  label,
  size = "icon-sm",
}: {
  value: string;
  label: string;
  size?: "icon-sm" | "icon";
}) => {
  const { copied, copy } = useCopy();

  return (
    <>
      <Button
        aria-label={label}
        onClick={() => {
          void copy(value);
        }}
        size={size}
        variant="ghost"
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
      <span aria-live="polite" className="v-sr">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
};
