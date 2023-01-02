import React from "react";
import Example from "./Example";

const ExampleContainer = () => (
  <Example
    title="Container"
    text="Responsive layout utility to control width of the main content area"
    href="/content/docs/utilities/container"
  >
    <div
      style={{
        borderBottom: "1px solid var(--uic-color-border-critical)",
        width: 140,
        textAlign: "center",
        position: "relative",
        top: "var(--uic-unit-x3)",
      }}
    >
      <div
        style={{
          width: 1,
          height: "var(--uic-unit-x4)",
          background: "var(--uic-color-border-critical)",
          position: "absolute",
          left: 0,
          bottom: "calc(var(--uic-unit-x2) * -1)",
        }}
      />
      <div
        style={{
          width: 1,
          height: "var(--uic-unit-x4)",
          background: "var(--uic-color-border-critical)",
          position: "absolute",
          right: 0,
          bottom: "calc(var(--uic-unit-x2) * -1)",
        }}
      />
    </div>
  </Example>
);

export default ExampleContainer;
