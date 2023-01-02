import React from "react";
import { Example } from "utilities/storybook";
import View from "components/View";
import Icon from "components/Icon";
import Text from "components/Text";
import IconZap from "icons/Zap";
import IconMic from "icons/Mic";

export default { title: "Utilities/Icon" };

export const size = () => (
  <Example>
    <Example.Item title="size: 4">
      <Icon svg={IconZap} size={4} />
    </Example.Item>
    <Example.Item title="size: 8">
      <Icon svg={IconZap} size={4} />
    </Example.Item>
    <Example.Item title={["responsive size", "[s] 5", "[m]: 10"]}>
      <Icon svg={IconZap} size={{ s: 5, m: 10 }} />
    </Example.Item>
    <Example.Item title="size: inherit from font">
      <Text variant="display-1">
        <View direction="row" align="center" gap={2}>
          <Icon svg={IconZap} />
          <View.Item>UIC</View.Item>
        </View>
      </Text>
    </Example.Item>
  </Example>
);

export const color = () => (
  <Example>
    <Example.Item title="color: neutral">
      <Icon svg={IconZap} />
    </Example.Item>
    <Example.Item title="color: neutral-faded">
      <Icon svg={IconZap} color="neutral-faded" />
    </Example.Item>
    <Example.Item title="color: primary">
      <Icon svg={IconZap} color="primary" />
    </Example.Item>
    <Example.Item title="color: critical">
      <Icon svg={IconZap} color="critical" />
    </Example.Item>
    <Example.Item title="color: positive">
      <Icon svg={IconZap} color="positive" />
    </Example.Item>
    <Example.Item title="color: inherit">
      <div style={{ color: "tomato" }}>
        <Icon svg={IconZap} />
      </div>
    </Example.Item>
  </Example>
);

export const autoWidth = () => (
  <Example>
    <Example.Item title="square boundaries">
      <div
        style={{
          background: "var(--uic-color-background-neutral)",
          display: "inline-block",
        }}
      >
        <Icon svg={IconMic} size={10} />
      </div>
    </Example.Item>
    <Example.Item title="auto width boundaries">
      <div
        style={{
          background: "var(--uic-color-background-neutral)",
          display: "inline-block",
        }}
      >
        <Icon svg={IconMic} size={10} autoWidth />
      </div>
    </Example.Item>
  </Example>
);
