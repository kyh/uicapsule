"use client";

import { EditorialCharts } from "./editorial-charts";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#26272b_0%,#141518_50%,#08090b_100%)] px-5">
      <div className="origin-center scale-[0.94]">
        <EditorialCharts />
      </div>
    </main>
  );
};

export default Preview;
