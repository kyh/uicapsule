import React from "react";
import { ThemeContext, GlobalColorModeContext } from "./Theme.context";

export const useGlobalColorMode = () => {
  const { mode } = React.useContext(GlobalColorModeContext);

  return mode;
};

export const useTheme = () => {
  const { colorMode, theme } = React.useContext(ThemeContext);
  const { mode, setMode, invertMode } = React.useContext(
    GlobalColorModeContext
  );

  return React.useMemo(
    () => ({
      theme,
      colorMode: colorMode || mode,
      setColorMode: setMode,
      invertColorMode: invertMode,
    }),
    [colorMode, mode, setMode, invertMode, theme]
  );
};
