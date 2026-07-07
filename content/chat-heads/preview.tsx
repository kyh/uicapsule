"use client";

import { ChatHeads } from "./chat-heads";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1a1c23_0%,#0d0e13_55%,#050609_100%)] p-5">
      <ChatHeads />
    </main>
  );
};

export default Preview;
