import * as React from "react";
import { createGlobalStyle } from "styled-components";

function App() {
  return (
    <>
      <GlobalStyle />
      <h1>App is enabled</h1>
    </>
  );
}

const GlobalStyle = createGlobalStyle`
  *:hover {
    outline: red dashed 1px !important;
  }
`;

export default App;
