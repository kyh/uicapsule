"use client";

import { HoldToConfirm } from "./hold-to-confirm";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#334155_0%,#0f172a_42%,#020617_100%)] p-5">
      <HoldToConfirm />
    </main>
  );
};

export default Preview;
