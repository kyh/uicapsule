import React from "react";
import { FormControl, View } from "@uicapsule/components";
import Example from "./Example";

const ExampleFormControl = () => (
  <Example
    title="Form control"
    text="Utility to easily re-use form field styles and accessibility features"
    href="/content/docs/utilities/form-control"
  >
    <FormControl>
      <FormControl.Label>Field label</FormControl.Label>
      <View
        width="160px"
        height="36px"
        backgroundColor="neutral"
        borderRadius="small"
      />
      <FormControl.Helper>Field helper</FormControl.Helper>
    </FormControl>
  </Example>
);

export default ExampleFormControl;
