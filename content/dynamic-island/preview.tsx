"use client";

import DynamicIsland from "./dynamic-island";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#334155_0%,#0f172a_42%,#020617_100%)] p-5">
      <div className="w-full max-w-[760px]">
        <DynamicIsland />
      </div>
    </main>
  );
};

export default Preview;
