import React from "react";
import { FormControl, Switch, View } from "@uicapsule/components";
import Example from "./Example";

const ExampleSwitch = () => (
  <Example
    title="Switch"
    text="Toggle for immediately changing the state of a single item"
    href="/content/docs/components/switch"
  >
    <FormControl>
      <View direction="row" gap={3}>
        <FormControl.Label>Wi-Fi</FormControl.Label>
        <Switch name="preview" defaultChecked />
      </View>
    </FormControl>
  </Example>
);

export default ExampleSwitch;
