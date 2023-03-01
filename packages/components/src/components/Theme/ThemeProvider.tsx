"use client";

import React from "react";
import { classNames } from "utilities/helpers";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import { ThemeContext } from "./Theme.context";
import { useTheme, useGlobalColorMode } from "./useTheme";
import * as T from "./Theme.types";
import s from "./Theme.module.css";

const ThemeProvider = (props: T.Props) => {
  const { theme, defaultTheme, colorMode, children, className } = props;
  const [stateTheme, setStateTheme] = React.useState(defaultTheme);
  const globalColorMode = useGlobalColorMode();
  const parentTheme = useTheme();
  const isRootProvider = !parentTheme.theme;
  const usedTheme = theme || stateTheme || parentTheme.theme;
  const parentColorMode = isRootProvider
    ? globalColorMode
    : parentTheme.colorMode;
  const invertedColorMode = parentColorMode === "light" ? "dark" : "light";
  const usedColorMode =
    colorMode === "inverted" ? invertedColorMode : colorMode || parentColorMode;
  const themeAttribute =
    usedColorMode === "dark" ? `${usedTheme}-dark` : `${usedTheme}-light`;
  const rootClassNames = classNames(s.root, className);

  const setTheme = (theme: string) => {
    setStateTheme(theme);
  };

  useIsomorphicLayoutEffect(() => {
    if (!document || !isRootProvider) return;
    document.body.setAttribute("data-uic-theme", themeAttribute);

    return () => {
      document.body.removeAttribute("data-uic-theme");
    };
  }, [themeAttribute, isRootProvider]);

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
        data-uic-theme={isRootProvider ? undefined : themeAttribute}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
