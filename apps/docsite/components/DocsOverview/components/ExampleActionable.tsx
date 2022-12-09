import React from "react";
import { Actionable } from "@uicapsule/components";
import Example from "./Example";

const ExampleActionable = () => (
  <Example
    title="Actionable"
    text="Low-level utility for creating interactive elements"
    href="/content/docs/utilities/actionable"
  >
    <Actionable onClick={() => {}}>Save progress</Actionable>
  </Example>
);

export default ExampleActionable;
