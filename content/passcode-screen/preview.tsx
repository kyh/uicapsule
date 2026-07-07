"use client";

import { PasscodeScreen } from "./passcode-screen";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#191c28_0%,#0c0e16_55%,#05060a_100%)] p-5">
      <PasscodeScreen />
    </main>
  );
};

export default Preview;
