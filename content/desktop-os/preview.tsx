"use client";

import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";

import { DesktopOS } from "./desktop-os";

const Preview = () => {
  // The boot sequence writes inline styles that React never clears, so replay
  // has to be a full remount rather than a timeline restart.
  const [bootKey, setBootKey] = useState(0);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#1a1612]">
      <DesktopOS key={bootKey} />

      <button
        type="button"
        onClick={() => setBootKey((n) => n + 1)}
        className="absolute bottom-4 left-4 z-[70] flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-black/65 hover:text-white"
      >
        <RotateCcwIcon className="size-3.5" />
        Replay boot
      </button>
    </div>
  );
};

export default Preview;
