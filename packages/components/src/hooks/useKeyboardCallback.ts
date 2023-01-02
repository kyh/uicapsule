import React from "react";

type Deps = Parameters<typeof React.useCallback>[1];

const useKeyboardCallback = (
  passedKey: string | string[],
  cb: () => void,
  deps: Deps = []
) => {
  const keys = typeof passedKey === "string" ? [passedKey] : passedKey;

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keys.includes(event.key)) return;
      cb();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, deps);
};

export default useKeyboardCallback;
