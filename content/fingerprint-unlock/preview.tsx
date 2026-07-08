"use client";

import { FingerprintUnlock } from "./fingerprint-unlock";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#171922_0%,#0b0c12_55%,#040508_100%)] p-5">
      <FingerprintUnlock />
    </main>
  );
};

export default Preview;
