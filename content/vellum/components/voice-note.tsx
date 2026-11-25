"use client";

import { CircleCheck } from "lucide-react";

import { Arc } from "./arc";
import { Button } from "./button";
import { clock, useNow } from "../lib/hooks";

/** A voice note being taken: settled words in full ink, the last few still faint as they land. */
export const VoiceNote = ({
  words,
  started,
  onCancel,
  onSave,
  pace = 230,
  compact = false,
}: {
  words: readonly string[];
  started: number;
  onCancel: () => void;
  onSave: () => void;
  pace?: number;
  compact?: boolean;
}) => {
  const now = useNow(250);
  const heard = Math.min(words.length, Math.floor((now - started) / pace));
  const finished = heard === words.length;
  const settled = finished ? heard : Math.max(0, heard - 4);
  const elapsed = Math.min(now - started, words.length * pace);

  return (
    <div className="v-stack">
      <div className="v-between">
        <span className="v-status" data-size="md" data-status={finished ? "idle" : "running"}>
          {finished ? <CircleCheck aria-hidden strokeWidth={2} /> : <Arc small />}
          {finished ? "Heard it all" : "Listening"}
        </span>
        <span className="v-caption v-t2 v-data">{clock(elapsed / 1000)}</span>
      </div>
      <p aria-live="off" className="v-heading v-transcript" data-compact={compact ? "" : undefined}>
        <span className="v-t1">{words.slice(0, settled).join(" ")} </span>
        <span className="v-t2">{words.slice(settled, heard).join(" ")}</span>
      </p>
      <div className="v-cluster v-end">
        <Button onClick={onCancel} size="sm" variant="secondary">
          Cancel
        </Button>
        <Button disabled={heard < 6} onClick={onSave} size="sm">
          Save note
        </Button>
      </div>
    </div>
  );
};
