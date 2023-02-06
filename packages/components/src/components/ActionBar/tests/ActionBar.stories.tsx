import React from "react";
import { Placeholder, Example } from "utilities/storybook";
import ActionBar from "components/ActionBar";
import Card from "components/Card";
import View from "components/View";

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

export const elevated = () => (
  <Example>
    <Example.Item title="elevated, position: top">
      <ActionBar position="top" elevated>
        <Placeholder />
      </ActionBar>
    </Example.Item>

    <Example.Item title="elevated, position: bottom">
      <ActionBar elevated>
        <Placeholder h={16} />
      </ActionBar>
    </Example.Item>
  </Example>
);

export const size = () => (
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
