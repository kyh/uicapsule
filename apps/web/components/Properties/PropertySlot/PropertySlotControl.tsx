import { Switch, TextField, View } from "@uicapsule/components";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import * as T from "../Properties.types";

const isControlModeText = (
  props: T.SlotControlProps
): props is T.SlotTextControlProps => {
  return props.control?.mode === "text";
};

const PropertySlotControl = (props: T.SlotControlProps) => {
  const { name, hideName } = props;

  return (
    <PropertyBaseControl name={name} hideName={hideName}>
      {isControlModeText(props) ? (
        <TextField
          name={name}
          value={props.value || ""}
          onChange={({ name, value }) =>
            props.onChange({ name, value: value || "" })
          }
        />
      ) : (
        <View padding={[2, 0]}>
          <Switch
            name={name}
            checked={!!props.value}
            onChange={({ name, checked }) => {
              props.onChange({
                name,
                value: checked || undefined,
              });
            }}
          />
        </View>
      )}
    </PropertyBaseControl>
  );
};

export default PropertySlotControl;
