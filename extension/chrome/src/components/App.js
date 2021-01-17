import * as React from "react";
import { ThemeProvider } from "styled-components";
import { shallowEqual, useSelector } from "react-redux";
import ElementHandler from "./ElementHandler";
import Popover from "./Popover";

export const lightTheme = {
  text: "#24292e",
  background: "#ffffff",
  contentBackground: "#f6f6f6",
};

export const darkTheme = {
  text: "#c9d1d9",
  background: "#0d1117",
  contentBackground: "#24292e",
};

function App() {
  const { darkMode } = useSelector((state) => state.app, shallowEqual);
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <ElementHandler />
      <Popover />
    </ThemeProvider>
  );
}

export default App;
