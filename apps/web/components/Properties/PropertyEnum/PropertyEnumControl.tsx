import { Select } from "@uicapsule/components";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import * as T from "../Properties.types";

const PropertyEnumControl = (props: T.EnumControlProps) => {
  const { name, value, onChange, options, hideName } = props;

  return (
    <PropertyBaseControl name={name} hideName={hideName}>
      <Select
        name={name}
        value={value}
        options={options.map((option) => ({ value: option, label: option }))}
        placeholder="Select value"
        onChange={({ name, value }) => onChange({ name, value })}
      />
    </PropertyBaseControl>
  );
};

export default PropertyEnumControl;
