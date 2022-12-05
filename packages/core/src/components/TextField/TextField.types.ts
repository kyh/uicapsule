import React from "react";
import type * as G from "types/global";
import { FormControlProps } from "components/FormControl";
import { IconProps } from "components/Icon";

type BaseProps = {
	id?: string;
	name: string;
	disabled?: boolean;
	placeholder?: string;
	startIcon?: IconProps["svg"];
	endIcon?: IconProps["svg"];
	startSlot?: React.ReactNode;
	endSlot?: React.ReactNode;
	onChange?: G.ChangeHandler<string>;
	className?: G.ClassName;
	attributes?: G.Attributes<"div", Props>;
	inputAttributes?: G.Attributes<"input", Omit<Props, "id">>;
	/** @deprecated use startIcon/endIcon instead */
	icon?: IconProps["svg"];
	/** @deprecated Use startIcon/endIcon instead */
	iconPosition?: "start" | "end";
} & Pick<FormControlProps, "hasError">;

export type ControlledProps = BaseProps & { value: string; defaultValue?: never };
export type UncontrolledProps = BaseProps & { value?: never; defaultValue?: string };
export type Props = ControlledProps | UncontrolledProps;
