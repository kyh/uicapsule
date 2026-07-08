"use client";

import { ImessageSend } from "./imessage-send";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1c1e26_0%,#0e0f14_55%,#050608_100%)] p-5">
      <ImessageSend />
    </main>
  );
};

export default Preview;
