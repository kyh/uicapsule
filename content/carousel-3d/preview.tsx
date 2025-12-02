import React from "react";

import { ImageCarousel, ImageCarouselCanvas } from "./carousel-3d";

const rootUrl =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/carousel-3d";

const cards = [
  { src: `${rootUrl}/1.webp` },
  { src: `${rootUrl}/2.webp` },
  { src: `${rootUrl}/3.webp` },
  { src: `${rootUrl}/4.webp` },
  { src: `${rootUrl}/5.webp` },
  { src: `${rootUrl}/6.webp` },
  { src: `${rootUrl}/7.webp` },
  { src: `${rootUrl}/8.webp` },
];

const Preview = () => {
  return (
    <ImageCarouselCanvas>
      <ImageCarousel images={cards.map((card) => card.src)} />
    </ImageCarouselCanvas>
  );
};

export default Preview;
