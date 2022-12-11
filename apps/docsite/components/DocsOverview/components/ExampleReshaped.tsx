import React from "react";
import { Icon } from "@uicapsule/components";
import IconUICapsule from "icons/colored/Reshaped";
import Example from "./Example";

const ExampleUICapsule = () => (
  <Example
    title="UICapsule provider"
    text="Global context provider that provides all of our and your components with a shared context"
    href="/content/docs/utilities/@uicapsule/components"
  >
    <Icon size={6} svg={IconUICapsule} />
  </Example>
);

export default ExampleUICapsule;
