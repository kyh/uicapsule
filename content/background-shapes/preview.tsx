"use client";

import { useEffect, useState } from "react";

import { BackgroundShapes } from "./background-shapes";

const Preview = () => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="h-full w-full bg-[#2164D6]">
      {size && <BackgroundShapes width={size.width} height={size.height} />}
    </div>
  );
};

export default Preview;
