import React from "react";
import { View, Checkbox } from "@uicapsule/components";
import Example from "./Example";

const ExampleCheckbox = () => (
  <Example
    title="Checkbox"
    text="Form field used to select one or multiple values from the list"
    href="/content/docs/components/checkbox"
  >
    <View gap={3}>
      <Checkbox name="preserve" defaultChecked>
        Keep me signed in
      </Checkbox>
      <Checkbox name="updates">Receive updates</Checkbox>
    </View>
  </Example>
);

export default ExampleCheckbox;
