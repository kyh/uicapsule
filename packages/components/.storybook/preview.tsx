import React from "react";
import { addDecorator } from "@storybook/react";
import { UICapsule, Button, View, Hidden, useTheme } from "../src";

import "../src/themes/reshaped/theme.css";
import "../src/themes/fragments/twitter/theme.css";

const ThemeSwitch = () => {
  const { invertColorMode } = useTheme();

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "KeyM") invertColorMode();
    };

    window.addEventListener("keypress", handleKey);
    return () => window.removeEventListener("keypress", handleKey);
  }, [invertColorMode]);

  return (
    <div style={{ position: "fixed", bottom: 8, right: 8 }}>
      <View direction="row" align="center" gap={3}>
        <View.Item>
          <Hidden hide={{ s: false, m: true }} as="span">
            S
          </Hidden>
          <Hidden hide={{ s: true, m: false, l: true }} as="span">
            M
          </Hidden>
          <Hidden hide={{ s: true, l: false, xl: true }} as="span">
            L
          </Hidden>
          <Hidden hide={{ s: true, xl: false }} as="span">
            XL
          </Hidden>
        </View.Item>
        <Button onClick={invertColorMode} size="small">
          Toggle mode
        </Button>
      </View>
    </div>
  );
};

addDecorator((story) => (
  <React.StrictMode>
    <UICapsule
      theme="uicapsule"
      toastOptions={{ "bottom-start": { width: 440, expanded: true } }}
    >
      <View padding={4}>{story()}</View>
      <ThemeSwitch />
    </UICapsule>
  </React.StrictMode>
));

export const parameters = {
  layout: "fullscreen",
};
