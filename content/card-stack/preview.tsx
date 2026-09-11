"use client";

import { CardStack } from "./card-stack";

const rootUrl = "https://pub-327ea719340342d3a3d5c5aa7f979e3a.r2.dev/card-stack-1";

const cards = [
  { alt: "UI Capsule", href: "https://uicapsule.com", src: `${rootUrl}/uic.webp` },
  { alt: "KYH", href: "https://kyh.io", src: `${rootUrl}/kyh.webp` },
  { alt: "Vibed Games", href: "https://vibedgames.com", src: `${rootUrl}/vg.webp` },
  { alt: "Founding", href: "https://founding.so", src: `${rootUrl}/found.webp` },
  { alt: "Init", href: "https://init.kyh.io", src: `${rootUrl}/init.webp` },
  { alt: "TC", href: "https://tc.kyh.io", src: `${rootUrl}/tc.webp` },
  { alt: "Data Embed", href: "https://dataembed.com", src: `${rootUrl}/data.webp` },
  { alt: "Yours Sincerely", href: "https://yourssincerely.org", src: `${rootUrl}/ys.webp` },
];

const Preview = () => <CardStack cards={cards} />;

export default Preview;
