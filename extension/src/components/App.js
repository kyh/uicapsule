import React from "react";
import { ThemeProvider } from "styled-components";
import { shallowEqual, useSelector } from "react-redux";
import ElementHandler from "./ElementHandler";
import Popover from "./Popover";

export const lightTheme = {
  primary: "#0070f4",
  text: "#24292e",
  background: "#ffffff",
  contentBackground: "#f6f6f6",
};

export const darkTheme = {
  primary: "#0070f4",
  text: "#c9d1d9",
  background: "#0d1117",
  contentBackground: "#24292e",
};

function App({ container, demoMode }) {
  const { darkMode } = useSelector((state) => state.app, shallowEqual);
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <ElementHandler container={container} demoMode={demoMode} />
      <Popover demoMode={demoMode} />
    </ThemeProvider>
  );
}

export default App;
