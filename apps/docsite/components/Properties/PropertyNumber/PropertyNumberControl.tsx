import React from "react";
import { TextField } from "@uicapsule/components";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import * as T from "../Properties.types";

const PropertyNumberControl = (props: T.NumberControlProps) => {
  const { name, value, onChange, hideName, control } = props;

  return (
    <PropertyBaseControl name={name} hideName={hideName}>
      <TextField
        name={name}
        value={value?.toString() || ""}
        inputAttributes={{ type: "number", min: 0, step: control?.step }}
        onChange={({ name, value }) =>
          onChange({ name, value: value?.length ? Number(value) : undefined })
        }
      />
    </PropertyBaseControl>
  );
};

export default PropertyNumberControl;
