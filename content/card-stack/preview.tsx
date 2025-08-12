import React from "react";

import { CardStack } from "./card-stack";

const rootUrl =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/card-stack-1";

const cards = [
  { src: `${rootUrl}/uic.webp`, href: "https://uicapsule.com" },
  { src: `${rootUrl}/kyh.webp`, href: "https://kyh.io" },
  { src: `${rootUrl}/vg.webp`, href: "https://vibedgames.com" },
  { src: `${rootUrl}/found.webp`, href: "https://founding.so" },
  { src: `${rootUrl}/init.webp`, href: "https://init.kyh.io" },
  { src: `${rootUrl}/tc.webp`, href: "https://tc.kyh.io" },
  { src: `${rootUrl}/data.webp`, href: "https://dataembed.com`" },
  { src: `${rootUrl}/ys.webp`, href: "https://yourssincerely.org" },
];

const Preview = () => {
  return <CardStack cards={cards} />;
};

export default Preview;
