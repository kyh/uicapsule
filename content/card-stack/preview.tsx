"use client";

import { CardStack } from "./card-stack";

const rootUrl =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/card-stack-1";

const cards = [
  { src: `${rootUrl}/uic.webp`, href: "https://uicapsule.com", alt: "UI Capsule" },
  { src: `${rootUrl}/kyh.webp`, href: "https://kyh.io", alt: "KYH" },
  { src: `${rootUrl}/vg.webp`, href: "https://vibedgames.com", alt: "Vibed Games" },
  { src: `${rootUrl}/found.webp`, href: "https://founding.so", alt: "Founding" },
  { src: `${rootUrl}/init.webp`, href: "https://init.kyh.io", alt: "Init" },
  { src: `${rootUrl}/tc.webp`, href: "https://tc.kyh.io", alt: "TC" },
  { src: `${rootUrl}/data.webp`, href: "https://dataembed.com", alt: "Data Embed" },
  { src: `${rootUrl}/ys.webp`, href: "https://yourssincerely.org", alt: "Yours Sincerely" },
];

const Preview = () => {
  return <CardStack cards={cards} />;
};

export default Preview;
