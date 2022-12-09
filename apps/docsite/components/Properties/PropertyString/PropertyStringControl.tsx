import React from "react";
import { TextField } from "@uicapsule/components";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import * as T from "../Properties.types";

const PropertyStringControl = (props: T.StringControlProps) => {
  const { name, value, onChange, hideName } = props;

  return (
    <PropertyBaseControl name={name} hideName={hideName}>
      <TextField
        name={name}
        value={value}
        onChange={({ name, value }) => onChange({ name, value })}
      />
    </PropertyBaseControl>
  );
};

export default PropertyStringControl;
