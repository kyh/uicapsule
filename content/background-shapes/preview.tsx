import React from "react";

import { BackgroundShapes } from "./background-shapes";

const Preview = () => {
  return (
    <div className="h-full w-full bg-[#2164D6]">
      <BackgroundShapes width={window.innerWidth} height={window.innerHeight} />
    </div>
  );
};

export default Preview;
