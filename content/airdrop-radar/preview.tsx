"use client";

import { AirdropRadar } from "./airdrop-radar";

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[repeating-radial-gradient(circle_at_50%_50%,transparent_0_139px,rgb(103_232_249/0.045)_139px_140px),radial-gradient(circle_at_50%_50%,rgb(34_211_238/0.16)_0%,transparent_38%),radial-gradient(ellipse_at_50%_40%,#0f1c38_0%,#081226_55%,#030712_100%)] p-5">
    <AirdropRadar />
  </main>
);

export default Preview;
