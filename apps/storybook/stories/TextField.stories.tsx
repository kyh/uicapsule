import React from "react";
import { Example } from "utilities/storybook";
import Icon from "components/Icon";
import IconZap from "icons/Zap";
import TextField from "components/TextField";
import FormControl from "components/FormControl";
import View from "components/View";

export default { title: "Components/TextField" };

export const value = () => (
  <Example>
    <Example.Item title="no value, placeholder">
      <TextField name="Name" placeholder="Enter your name" />
    </Example.Item>

    <Example.Item title="value, uncontrolled">
      <TextField
        name="Name"
        defaultValue="UICapsule"
        placeholder="Enter your name"
      />
    </Example.Item>

    <Example.Item title="value, controlled">
      <TextField name="Name" value="UICapsule" placeholder="Enter your name" />
    </Example.Item>
  </Example>
);

export const disabled = () => (
  <Example>
    <Example.Item title="disabled, no value">
      <TextField name="Name" placeholder="Enter your name" disabled />
    </Example.Item>
    <Example.Item title="disabled, value">
      <TextField
        name="Name"
        placeholder="Enter your name"
        disabled
        value="UICapsule"
      />
    </Example.Item>
  </Example>
);

export const error = () => (
  <Example>
    <Example.Item title="error">
      <TextField name="Name" placeholder="Enter your name" hasError />
    </Example.Item>
  </Example>
);

export const icon = () => (
  <Example>
    <Example.Item title="startIcon">
      <TextField
        name="Name"
        placeholder="Enter your name"
        value="UICapsule"
        startIcon={IconZap}
      />
    </Example.Item>
    <Example.Item title="endIcon">
      <TextField
        name="Name"
        placeholder="Enter your name"
        value="UICapsule"
        endIcon={IconZap}
      />
    </Example.Item>
  </Example>
);

export const slots = () => (
  <Example>
    <Example.Item title="startSlot">
      <TextField
        name="Name"
        placeholder="Enter your name"
        value="UICapsule"
        startSlot={
          <View
            width="40px"
            height="40px"
            backgroundColor="neutral"
            borderRadius="small"
          />
        }
      />
    </Example.Item>
    <Example.Item title="endSlot">
      <TextField
        name="Name"
        placeholder="Enter your name"
        value="UICapsule"
        endSlot={
          <View
            width="40px"
            height="40px"
            backgroundColor="neutral"
            borderRadius="small"
          />
        }
      />
    </Example.Item>
  </Example>
);

export const formControl = () => (
  <Example>
    <Example.Item title="with helper">
      <FormControl>
        <FormControl.Label>Name</FormControl.Label>
        <TextField name="name" placeholder="Enter your name" />
        <FormControl.Helper>Helper</FormControl.Helper>
        <FormControl.Error>This field is required</FormControl.Error>
      </FormControl>
    </Example.Item>
    <Example.Item title="with error">
      <FormControl hasError>
        <FormControl.Label>Name</FormControl.Label>
        <TextField name="name" placeholder="Enter your name" />
        <FormControl.Error>This field is required</FormControl.Error>
      </FormControl>
    </Example.Item>
  </Example>
);
