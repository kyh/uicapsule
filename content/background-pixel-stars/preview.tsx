import React from "react";

import { BackgroundPixelStars } from "./background-pixel-stars";

const Preview = () => {
  return (
    <div className="h-dvh w-dvw bg-black bg-[url('https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/vibedgames/bg.png')] bg-[size:10px]">
      <BackgroundPixelStars />
    </div>
  );
};

export default Preview;
