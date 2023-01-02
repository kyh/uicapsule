import React from "react";
import { Placeholder, Example } from "utilities/storybook";
import ActionBar from "components/ActionBar";

export default { title: "Components/ActionBar" };

export const position = () => (
  <Example>
    <Example.Item title="position: top">
      <ActionBar position="top">
        <Placeholder />
      </ActionBar>
    </Example.Item>

    <Example.Item title="position: bottom">
      <ActionBar>
        <Placeholder />
      </ActionBar>
    </Example.Item>
  </Example>
);

export const sizeLarge = () => (
  <Example>
    <Example.Item title="size: medium">
      <ActionBar>
        <Placeholder />
      </ActionBar>
    </Example.Item>

    <Example.Item title="size: large">
      <ActionBar size="large">
        <Placeholder />
      </ActionBar>
    </Example.Item>
  </Example>
);
