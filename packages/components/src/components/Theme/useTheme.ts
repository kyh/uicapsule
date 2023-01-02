import { useContext, useMemo } from "react";
import { ThemeContext, GlobalColorModeContext } from "./Theme.context";

export const useGlobalColorMode = () => {
  const { mode } = useContext(GlobalColorModeContext);
  return mode;
};

export const useTheme = () => {
  const { colorMode, theme } = useContext(ThemeContext);
  const { mode, setMode, invertMode } = useContext(GlobalColorModeContext);

  return useMemo(
    () => ({
      theme,
      colorMode: colorMode || mode,
      setColorMode: setMode,
      invertColorMode: invertMode,
    }),
    [colorMode, mode, setMode, invertMode, theme]
  );
};
