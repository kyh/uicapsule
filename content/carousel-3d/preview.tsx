import React from "react";

import { ImageCarousel, ImageCarouselCanvas } from "./source";

const sampleImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop&sat=-100",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=1000&fit=crop",
];

const Preview = () => {
  return (
    <ImageCarouselCanvas>
      <ImageCarousel images={sampleImages} />
    </ImageCarouselCanvas>
  );
};

export default Preview;
