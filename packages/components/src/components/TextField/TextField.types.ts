import React from "react";
import type * as G from "types/global";
import { FormControlProps } from "components/FormControl";
import { IconProps } from "components/Icon";

type Size = G.Responsive<"medium" | "large" | "xlarge">;

type BaseProps = {
  id?: string;
  name: string;
  size?: Size;
  disabled?: boolean;
  placeholder?: string;
  startIcon?: SlotProps["icon"];
  endIcon?: SlotProps["icon"];
  startSlot?: SlotProps["slot"];
  endSlot?: SlotProps["slot"];
  onChange?: G.ChangeHandler<string>;
  className?: G.ClassName;
  attributes?: G.Attributes<"div", Props>;
  inputAttributes?: G.Attributes<"input">;
  /** @deprecated use startIcon/endIcon instead */
  icon?: SlotProps["icon"];
  /** @deprecated Use startIcon/endIcon instead */
  iconPosition?: "start" | "end";
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

export type SlotProps = {
  slot?: React.ReactNode;
  icon?: IconProps["svg"];
  size: Size;
};
