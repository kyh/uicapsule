import React from "react";

import { ShapesBackground } from "./shapes-background";

const Preview = () => {
  return (
    <div className="h-full w-full bg-[#2164D6]">
      <ShapesBackground width={window.innerWidth} height={window.innerHeight} />
    </div>
  );
};

export default Preview;
