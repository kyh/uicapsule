"use client";

import { WidgetStack } from "./widget-stack";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#191b25_0%,#0d0e15_55%,#050609_100%)] p-5">
      <WidgetStack />
    </main>
  );
};

export default Preview;
