import React from "react";
import { Icon } from "@uicapsule/components";
import IconBell from "icons/Bell";
import Example from "./Example";

const ExampleIcon = () => (
  <Example
    title="Icon"
    text="Wrapper for SVG assets to control their appearance"
    href="/content/docs/utilities/icon"
  >
    <Icon svg={IconBell} size={6} />
  </Example>
);

export default ExampleIcon;
