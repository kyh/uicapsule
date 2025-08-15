import React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const Preview = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-800 text-slate-50">
      <Tooltip>
        <TooltipTrigger className="p-4">Hover</TooltipTrigger>
        <TooltipContent type="block">
          <div style={{ width: 200, aspectRatio: "16/9" }} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default Preview;
