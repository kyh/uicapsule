"use client";

import { SwipeActions } from "./swipe-actions";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#20222a_0%,#101116_55%,#06070a_100%)] p-5">
      <SwipeActions />
    </main>
  );
};

export default Preview;
