"use client";

import { useState } from "react";
import { SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";

import { Resizable } from "./resizable";

export const Preview = () => {
  const [width, setWidth] = useState(360);

  return (
    <Resizable width={width} setWidth={setWidth}>
      <SandpackLayout className="h-full rounded-xl! shadow-[0_5px_100px_1px_#0000001a]">
        <SandpackPreview className="h-full!" />
      </SandpackLayout>
    </Resizable>
  );
};
