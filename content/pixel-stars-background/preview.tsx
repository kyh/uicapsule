import React from "react";

import { PixelStarsBackground } from "./pixel-stars-background";

const Preview = () => {
  return (
    <div className="h-full w-full bg-black bg-[url('https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/vibedgames/bg.png')] bg-[size:10px]">
      <PixelStarsBackground />
    </div>
  );
};

export default Preview;
