import React from "react";
import { useTheme } from "@uicapsule/components";

export const colorModeKey = "__uicapsule-color-mode";

const useStoredColorMode = () => {
  const theme = useTheme();

  React.useEffect(() => {
    localStorage.setItem(colorModeKey, theme.colorMode);
  }, [theme.colorMode]);

  return theme;
};

export default useStoredColorMode;
