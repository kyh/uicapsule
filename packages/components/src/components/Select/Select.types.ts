import React from "react";
import type * as G from "types/global";
import { FormControlProps } from "components/FormControl";
import { IconProps } from "components/Icon";

type Size = G.Responsive<"medium" | "large" | "xlarge">;

type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

type BaseProps = {
  id?: string;
  name: string;
  options: Option[];
  size?: Size;
  disabled?: boolean;
  placeholder?: string;
  icon?: IconProps["svg"];
  startSlot?: React.ReactNode;
  onChange?: G.ChangeHandler<string, React.ChangeEvent<HTMLSelectElement>>;
  className?: G.ClassName;
  attributes?: G.Attributes<"div", Props>;
  inputAttributes?: G.Attributes<"select", Omit<Props, "id">>;
} & Pick<FormControlProps, "hasError">;

export type ControlledProps = BaseProps & {
  value: string;
  defaultValue?: never;
};
export type UncontrolledProps = BaseProps & {
  value?: never;
  defaultValue?: string;
};
export type Props = ControlledProps | UncontrolledProps;
