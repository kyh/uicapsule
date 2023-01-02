import { Button } from "@uicapsule/components";
import IconSun from "icons/Sun";
import IconMoon from "icons/Moon";
import useStoredColorMode from "hooks/useStoredColorMode";

const HeaderColorMode = () => {
  const { invertColorMode, colorMode } = useStoredColorMode();

  return (
    <Button
      variant="ghost"
      startIcon={colorMode === "dark" ? IconSun : IconMoon}
      onClick={invertColorMode}
      attributes={{ "aria-label": "Switch color mode" }}
    />
  );
};

export default HeaderColorMode;
