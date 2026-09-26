"use client";

import { SeekFilmstrip } from "./seek-filmstrip";

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_45%_70%_at_50%_-15%,rgb(147_197_253/0.16)_0%,transparent_70%),radial-gradient(ellipse_at_50%_50%,#0f1d3d_0%,#081330_50%,#030817_100%)] p-5">
    <SeekFilmstrip />
  </main>
);

export default Preview;
