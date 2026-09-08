"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const Preview = () => (
  <div className="flex h-screen items-center justify-center bg-slate-800 text-slate-50">
    <Tooltip>
      <TooltipTrigger className="p-4">Hover</TooltipTrigger>
      <TooltipContent type="block">
        <div style={{ aspectRatio: "16/9", width: 200 }} />
      </TooltipContent>
    </Tooltip>
  </div>
);

export default Preview;
