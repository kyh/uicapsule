"use client";

import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";

import { Arc } from "./arc";

/** The model's working before it answers, collapsed to a single line once done. */
export const Reasoning = ({
  seconds,
  streaming = false,
  heading,
  children,
}: {
  seconds: number;
  streaming?: boolean;
  heading?: string;
  children: string;
}) => {
  const [pinned, setPinned] = useState<boolean | null>(null);
  const id = useId();
  const open = pinned ?? streaming;

  return (
    <div className="v-stack-sm">
      <button
        aria-controls={id}
        aria-expanded={open}
        className="v-fold-trigger"
        onClick={() => {
          setPinned(!open);
        }}
        type="button"
      >
        {streaming ? <Arc small /> : null}
        <span className="v-truncate">
          {streaming ? (heading ?? "Thinking") : `Thought for ${seconds}s`}
        </span>
        <ChevronRight aria-hidden className="v-chev" />
      </button>
      {open ? (
        <p className="v-fold-body v-body-sm v-t2 v-reasoning-body" id={id}>
          {children}
        </p>
      ) : null}
    </div>
  );
};
