import React from "react";
import { useTheme } from "@uicapsule/components";

const useStoredColorMode = () => {
  const theme = useTheme();

  React.useEffect(() => {
    localStorage.setItem("__@uicapsule/components-mode", theme.colorMode);
  }, [theme.colorMode]);

  return theme;
};

export default useStoredColorMode;
