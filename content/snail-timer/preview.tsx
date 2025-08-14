import React from "react";

import { SnailTimer } from "./snail-timer";

const Preview = () => {
  const [started, setStarted] = React.useState(false);

  const handleToggleStarted = () => {
    setStarted((prev) => !prev);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button onClick={handleToggleStarted}>
        {started ? "Stop Timer" : "Start Countdown"}
      </button>
      <SnailTimer started={started} />
    </div>
  );
};

export default Preview;
