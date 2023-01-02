import { useTheme } from "@uicapsule/components";
import { useEffect } from "react";

export const colorModeKey = "__uicapsule-color-mode";

const useStoredColorMode = () => {
  const theme = useTheme();

  useEffect(() => {
    localStorage.setItem(colorModeKey, theme.colorMode);
  }, [theme.colorMode]);

  return theme;
};

export default useStoredColorMode;
