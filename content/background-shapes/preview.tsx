import React from "react";

import { BackgroundShapes } from "./background-shapes";

const Preview = () => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const [seed, setSeed] = React.useState(668);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeed(Math.floor(Math.random() * 1000));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={setContainer} className="h-full w-full bg-[#2164D6]">
      {container && (
        <BackgroundShapes
          width={container.offsetWidth}
          height={container.offsetHeight}
          seed={seed}
        />
      )}
    </div>
  );
};

export default Preview;
