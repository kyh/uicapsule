"use client";

import { NotificationShade } from "./notification-shade";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#181b26_0%,#0c0e15_55%,#050609_100%)] p-5">
      <NotificationShade />
    </main>
  );
};

export default Preview;
