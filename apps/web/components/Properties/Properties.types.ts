import type { ModalProps } from "@uicapsule/components";

export enum ControlType {
  string = "string",
  enum = "enum",
  slot = "slot",
  boolean = "boolean",
  number = "number",
  icon = "icon",
  array = "array",
  object = "object",
  function = "function",
  custom = "custom",
}

type BaseOptions = {
  type: ControlType;
  value: unknown;
  extraOptions?: Record<string, unknown>;
  extraControlOptions?: Record<string, unknown>;
};

type RequiredControl<O extends BaseOptions> = {
  control?: {
    ignore?: boolean;
    defaultValue?: O["value"];
  } & O["extraControlOptions"];
};

type BaseProperty<O extends BaseOptions> = {
  responsive?: boolean;
  required?: boolean;
  description?: string;
  type: O["type"];
  defaultValue?: O["value"];
  docs?: {
    type?: string;
  };
} & (O["extraControlOptions"] extends Record<
  keyof O["extraControlOptions"],
  unknown
>
  ? RequiredControl<O>
  : Partial<RequiredControl<O>>) &
  O["extraOptions"];

export type Property =
  | StringProperty
  | SlotProperty
  | EnumProperty
  | BooleanProperty
  | NumberProperty
  | IconProperty
  | ArrayProperty
  | ObjectProperty
  | FunctionProperty
  | CustomProperty;
export type Properties = Record<string, Property>;

export type BaseControl<T extends Property, V> = T & {
  onChange: (args: { name: string; value?: V }) => void;
  hideName?: boolean;
  name: string;
  value?: V;
};

type StringGeneric = { type: ControlType.string; value: string };
export type StringProperty = BaseProperty<StringGeneric>;
export type StringControlProps = BaseControl<
  StringProperty,
  StringGeneric["value"]
>;

export type SlotPropertyMode = "node" | "text";
type SlotNodeGeneric = {
  type: ControlType.slot;
  value: boolean;
  extraControlOptions: {
    mode?: Extract<SlotPropertyMode, "node">;
    height?: number;
  };
};
type SlotTextGeneric = {
  type: ControlType.slot;
  value: string;
  extraControlOptions: { mode: Extract<SlotPropertyMode, "text"> };
};
type SlotNodeProperty = BaseProperty<SlotNodeGeneric>;
type SlotTextProperty = BaseProperty<SlotTextGeneric>;
export type SlotProperty = SlotNodeProperty | SlotTextProperty;
export type SlotNodeControlProps = BaseControl<SlotNodeProperty, boolean>;
export type SlotTextControlProps = BaseControl<SlotTextProperty, string>;
export type SlotControlProps = SlotNodeControlProps | SlotTextControlProps;

type EnumGeneric = {
  type: ControlType.enum;
  value: string;
  extraOptions: { options: string[] };
};
export type EnumProperty = BaseProperty<EnumGeneric>;
export type EnumControlProps = BaseControl<EnumProperty, EnumGeneric["value"]>;

type BooleanGeneric = { type: ControlType.boolean; value: boolean };
export type BooleanProperty = BaseProperty<BooleanGeneric>;
export type BooleanControlProps = BaseControl<
  BooleanProperty,
  BooleanGeneric["value"]
>;

type NumberGeneric = {
  type: ControlType.number;
  value: number;
  extraControlOptions: { step?: number };
};
export type NumberProperty = BaseProperty<NumberGeneric>;
export type NumberControlProps = BaseControl<
  NumberProperty,
  NumberGeneric["value"]
>;

type IconGeneric = { type: ControlType.icon; value: string };
export type IconProperty = BaseProperty<IconGeneric>;
export type IconControlProps = BaseControl<IconProperty, IconGeneric["value"]>;

type ArrayGeneric = {
  type: ControlType.array;
  value: unknown[];
  extraOptions: {
    item: Property;
  };
};
export type ArrayProperty = BaseProperty<ArrayGeneric>;
export type ArrayControlProps = BaseControl<
  ArrayProperty,
  ArrayGeneric["value"]
>;
export type ArrayAddControlProps = { onAdd: () => void };
export type ArrayItemControlProps = {
  item: Property;
  value: unknown;
  index: number;
  onRemove: () => void;
  onChange: (value: unknown) => void;
};

type ObjectGeneric = {
  type: ControlType.object;
  value: Record<string, unknown>;
  extraOptions: {
    properties?: Properties;
  };
};
export type ObjectProperty = BaseProperty<ObjectGeneric>;
export type ObjectControlProps = BaseControl<
  ObjectProperty,
  ObjectGeneric["value"]
>;

type FunctionGeneric = {
  type: ControlType.function;
  value: Function;
  extraOptions: {
    args?: Array<{ name: string; type: string }>; // Can we use control types here?
    returnValue?: string;
  };
};
export type FunctionProperty = BaseProperty<FunctionGeneric>;

export type CustomPropertyGeneric = {
  type: ControlType.custom;
  value: unknown;
};
export type CustomProperty = BaseProperty<CustomPropertyGeneric>;

/**
 * Component props
 */
export type ProviderProps = {
  properties: Record<string, Properties>;
  children: React.ReactNode;
};

export type TableProps = {
  name?: string;
};

export type ControlsProps = Pick<ModalProps, "active" | "onClose"> & {
  values: Record<string, any>;
  onPropertyChange: (
    sectionName: string,
    args: { name: string; value?: unknown }
  ) => void;
};

export type DocsProps<T extends Property> = { property: T; name: string };
export type BaseControlProps = {
  name: string;
  hideName?: boolean;
  preserveNameSpace?: boolean;
  children: React.ReactNode;
};
