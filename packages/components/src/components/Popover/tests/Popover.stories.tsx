import React from "react";
import { Example } from "utilities/storybook";
import View from "components/View";
import Popover from "components/Popover";
import Button from "components/Button";

export default { title: "Components/Popover" };

const Demo = (props: any) => {
  const { position, ...rest } = props;
  return (
    <Popover position={position} {...rest}>
      <Popover.Trigger>
        {(attributes) => <Button attributes={attributes}>Open</Button>}
      </Popover.Trigger>
      <Popover.Content>
        <View gap={2} align="start">
          Popover content
          <Button onClick={() => {}}>Button</Button>
        </View>
      </Popover.Content>
    </Popover>
  );
};

export const position = () => (
  <Example>
    <Example.Item title="position: bottom-start">
      <View align="center">
        <Demo position="bottom-start" />
      </View>
    </Example.Item>
    <Example.Item title="position: bottom">
      <View align="center">
        <Demo position="bottom" />
      </View>
    </Example.Item>
    <Example.Item title="position: bottom-end">
      <View align="center">
        <Demo position="bottom-end" />
      </View>
    </Example.Item>
    <Example.Item title="position: top-start">
      <View align="center">
        <Demo position="top-start" />
      </View>
    </Example.Item>
    <Example.Item title="position: top">
      <View align="center">
        <Demo position="top" />
      </View>
    </Example.Item>
    <Example.Item title="position: top-end">
      <View align="center">
        <Demo position="top-end" />
      </View>
    </Example.Item>
    <Example.Item title="position: start">
      <View align="center">
        <Demo position="start" />
      </View>
    </Example.Item>
    <Example.Item title="position: end">
      <View align="center">
        <Demo position="end" />
      </View>
    </Example.Item>
    <Example.Item
      title={[
        "position: bottom",
        "changes to top-start because it doesn't fit",
      ]}
    >
      <View align="center">
        <Demo position="bottom" />
      </View>
    </Example.Item>
  </Example>
);

export const width = () => (
  <Example>
    <Example.Item title="width: 400">
      <Demo width="400px" />
    </Example.Item>
    <Example.Item title="width: full">
      <Demo width="full" />
    </Example.Item>
  </Example>
);

export const variant = () => (
  <Example>
    <Example.Item title="variant: headless">
      <Popover variant="headless">
        <Popover.Trigger>
          {(attributes) => <Button attributes={attributes}>Open</Button>}
        </Popover.Trigger>
        <Popover.Content>
          <View
            height="100px"
            borderColor="primary"
            borderRadius="medium"
            backgroundColor="neutral-faded"
          />
        </Popover.Content>
      </Popover>
    </Example.Item>
  </Example>
);

export const padding = () => (
  <Example>
    <Example.Item title="padding: 0">
      <Demo padding={0} />
    </Example.Item>
    <Example.Item title="width: full">
      <Demo padding={6} />
    </Example.Item>
  </Example>
);

export const triggerType = () => (
  <Example>
    <Example.Item title="triggerType: hover">
      <Demo triggerType="hover" />
    </Example.Item>
  </Example>
);
