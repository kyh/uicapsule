"use client";

import { ContextMenuPeek } from "./context-menu-peek";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1c1e26_0%,#0e0f14_55%,#050608_100%)] p-5">
      <ContextMenuPeek />
    </main>
  );
};

export default Preview;
