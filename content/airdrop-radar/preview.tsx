"use client";

import { AirdropRadar } from "./airdrop-radar";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#171a24_0%,#0b0d14_55%,#040509_100%)] p-5">
      <AirdropRadar />
    </main>
  );
};

export default Preview;
