"use client";

import {
  ArrowUp,
  CalendarClock,
  Check,
  Copy,
  Ellipsis,
  Mic,
  Paperclip,
  Pin,
  Search,
  Square,
  Undo2,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";

const SET = [
  { Icon: ArrowUp, name: "Send" },
  { Icon: Square, name: "Stop" },
  { Icon: Mic, name: "Dictate" },
  { Icon: Paperclip, name: "Attach" },
  { Icon: Copy, name: "Copy" },
  { Icon: Check, name: "Copied" },
  { Icon: Search, name: "Search" },
  { Icon: Ellipsis, name: "More" },
  { Icon: Undo2, name: "Undo" },
  { Icon: CalendarClock, name: "Schedule" },
  { Icon: X, name: "Close" },
  { Icon: Pin, name: "Pin" },
] as const;

/** Lucide at a 1.75 stroke, 12, 14 and 16px, and only where a shape beats a word. */
export const IconFoundation = () => {
  const [pinned, setPinned] = useState(true);

  return (
    <>
      <div className="v-icon-grid">
        {SET.map(({ Icon, name }) => (
          <div className="v-icon-cell" key={name}>
            <Icon aria-hidden />
            {name}
          </div>
        ))}
      </div>
      <div className="v-stage v-cluster v-gap-24 v-pad-20">
        <div className="v-stack-sm v-text-center" inert>
          <Button aria-label="Copy run ID" size="icon-sm" variant="ghost">
            <Copy aria-hidden />
          </Button>
          <span className="v-caption v-t2">12 in a 26px control</span>
        </div>
        <div className="v-stack-sm v-text-center" inert>
          <Button size="md" variant="secondary">
            <Search aria-hidden />
            Find a run
          </Button>
          <span className="v-caption v-t2">14 beside a 13px label</span>
        </div>
        <div className="v-stack-sm v-text-center" inert>
          <Button aria-label="Dictate" size="icon-lg" variant="secondary">
            <Mic aria-hidden />
          </Button>
          <span className="v-caption v-t2">16 in a 36px control</span>
        </div>
        <div className="v-stack-sm v-text-center">
          <Button
            aria-label="Pin this thread"
            aria-pressed={pinned}
            onClick={() => setPinned(!pinned)}
            size="icon"
            variant="ghost"
          >
            <Pin aria-hidden fill={pinned ? "currentColor" : "none"} />
          </Button>
          <span className="v-caption v-t2">Filled only while a toggle is on</span>
        </div>
      </div>
    </>
  );
};
