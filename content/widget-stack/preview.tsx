"use client";

import { WidgetStack } from "./widget-stack";

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_18%_22%,rgb(99_102_241/0.55)_0%,transparent_42%),radial-gradient(circle_at_85%_80%,rgb(139_92_246/0.45)_0%,transparent_45%),radial-gradient(circle_at_78%_12%,rgb(59_130_246/0.35)_0%,transparent_38%),linear-gradient(160deg,#1e1b4b_0%,#14113a_55%,#0a0823_100%)] p-5">
    <WidgetStack />
  </main>
);

export default Preview;
