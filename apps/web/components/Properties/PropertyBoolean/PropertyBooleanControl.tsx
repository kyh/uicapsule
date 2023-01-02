import { Switch, View } from "@uicapsule/components";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import * as T from "../Properties.types";

const PropertyBooleanControl = (props: T.BooleanControlProps) => {
  const { name, value, onChange, hideName } = props;

  return (
    <PropertyBaseControl name={name} hideName={hideName}>
      <View padding={[2, 0]}>
        <Switch
          name={name}
          checked={!!value}
          onChange={({ name, checked }) => {
            onChange({ name, value: checked });
          }}
        />
      </View>
    </PropertyBaseControl>
  );
};

export default PropertyBooleanControl;
