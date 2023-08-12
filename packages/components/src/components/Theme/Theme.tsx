"use client";

import React from "react";
import { classNames } from "utilities/helpers";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import { ThemeContext } from "./Theme.context";
import { useTheme, useGlobalColorMode } from "./useTheme";
import * as T from "./Theme.types";
import s from "./Theme.module.css";

const Theme = (props: T.Props) => {
  const { name, defaultName, colorMode, children, className } = props;
  const [stateTheme, setStateTheme] = React.useState(defaultName);
  const globalColorMode = useGlobalColorMode();
  const parentTheme = useTheme();
  const isRootProvider = !parentTheme.theme;
  const usedTheme = name || stateTheme || parentTheme.theme;
  const parentColorMode = isRootProvider
    ? globalColorMode
    : parentTheme.colorMode;
  const invertedColorMode = parentColorMode === "light" ? "dark" : "light";
  const usedColorMode =
    colorMode === "inverted" ? invertedColorMode : colorMode || parentColorMode;
  const rootClassNames = classNames(s.root, className);

  const setTheme = (theme: string) => {
    setStateTheme(theme);
  };

  useIsomorphicLayoutEffect(() => {
    if (!document || !isRootProvider) return;
    document.documentElement.setAttribute("data-uic-theme", usedTheme);
    document.documentElement.setAttribute("data-uic-color-mode", usedColorMode);

    return () => {
      document.documentElement.removeAttribute("data-uic-theme");
      document.documentElement.removeAttribute("data-uic-color-mode");
    };
  }, [usedTheme, usedColorMode, isRootProvider]);

  return (
    <ThemeContext.Provider
      value={{
        theme: usedTheme,
        colorMode: usedColorMode,
        setTheme,
      }}
    >
      <div
        className={rootClassNames}
        data-uic-theme={isRootProvider ? undefined : usedTheme}
        data-uic-color-mode={isRootProvider ? undefined : usedColorMode}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default Theme;
