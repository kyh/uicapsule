import * as T from "./Properties.types";

export const isIgnoredControl = (property: T.Property, name: string) => {
  return (
    property?.control?.ignore ||
    property.type === T.ControlType.function ||
    name === "className" ||
    name === "attributes"
  );
};

export const resolveSlotValue = ({
  value,
  control,
}: {
  value: string | boolean;
  control?: T.SlotProperty["control"];
}) => {
  if (control?.mode === "text" && value) return value.toString();
  if (!!value) {
    if (control && "height" in control && control.height) {
      return `<Placeholder h={${control?.height}} />`;
    }

    return "<Placeholder />";
  }

  return "";
};
