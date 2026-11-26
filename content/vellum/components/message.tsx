"use client";

import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { useCopy } from "../lib/hooks";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

/** What the person wrote, set on paper; the agent replies straight onto the page. */
export const Bubble = ({ children }: { children: ReactNode }) => (
  <p className="v-bubble">{children}</p>
);

const Rate = () => {
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  return (
    <>
      <Button
        aria-label="Good answer"
        aria-pressed={rating === "up"}
        onClick={() => setRating(rating === "up" ? null : "up")}
        size="icon-sm"
        variant="ghost"
      >
        <ThumbsUp aria-hidden />
      </Button>
      <Button
        aria-label="Bad answer"
        aria-pressed={rating === "down"}
        onClick={() => setRating(rating === "down" ? null : "down")}
        size="icon-sm"
        variant="ghost"
      >
        <ThumbsDown aria-hidden />
      </Button>
    </>
  );
};

/** The agent's turn: plain flow at full width, then a quiet footer of ghost icons. */
export const AgentTurn = ({
  children,
  model,
  text,
  onRetry,
  stopped = false,
}: {
  children: ReactNode;
  model?: string;
  text?: string;
  onRetry?: () => void;
  stopped?: boolean;
}) => {
  const { copied, copy } = useCopy();

  return (
    <article className="v-stack v-turn">
      {children}
      {model ? (
        <footer className="v-turn-foot">
          {text && !stopped ? (
            <Tooltip
              content={copied ? "Copied" : "Copy"}
              render={(props) => (
                <Button
                  {...props}
                  aria-label={copied ? "Copied" : "Copy answer"}
                  onClick={() => copy(text)}
                  size="icon-sm"
                  variant="ghost"
                >
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                </Button>
              )}
            />
          ) : null}
          {stopped ? null : <Rate />}
          {onRetry ? (
            <Button aria-label="Ask again" onClick={onRetry} size="icon-sm" variant="ghost">
              <RotateCcw aria-hidden />
            </Button>
          ) : null}
          <span className="v-caption v-t2 v-turn-model">{stopped ? "Stopped" : model}</span>
        </footer>
      ) : null}
    </article>
  );
};
