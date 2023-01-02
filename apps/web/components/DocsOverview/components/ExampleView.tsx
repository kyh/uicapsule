import React from "react";
import { View } from "@uicapsule/components";
import Example from "./Example";

const ExampleView = () => (
  <Example
    title="View"
    text="Low-level utility for working with flexbox API and applying design tokens"
    href="/content/docs/utilities/view"
  >
    <View width="200px" maxWidth="100%" gap={2}>
      <View direction="row" gap={2} align="center">
        <View
          width="32px"
          height="32px"
          borderRadius="medium"
          backgroundColor="neutral"
        />
        <View.Item grow>
          <View height="12px" backgroundColor="neutral" borderRadius="medium" />
        </View.Item>
      </View>
      <View direction="row" gap={2} align="center">
        <View
          width="32px"
          height="32px"
          borderRadius="medium"
          backgroundColor="neutral"
        />
        <View.Item grow>
          <View height="12px" backgroundColor="neutral" borderRadius="medium" />
        </View.Item>
      </View>
    </View>
  </Example>
);

export default ExampleView;
