import React from "react";
import { View, Card } from "@uicapsule/components";
import Example from "./Example";

const ExampleDivider = () => (
  <Example
    title="Divider"
    text="Element for visual content separation"
    href="/content/docs/components/divider"
  >
    <View width="240px" maxWidth="100%">
      <Card>
        <View divided gap={2}>
          <View direction="row" gap={3}>
            <View.Item grow>Work</View.Item>
            <View.Item>1,765</View.Item>
          </View>
          <View direction="row" gap={3}>
            <View.Item grow>Vacation</View.Item>
            <View.Item>2,235</View.Item>
          </View>
        </View>
      </Card>
    </View>
  </Example>
);

export default ExampleDivider;
