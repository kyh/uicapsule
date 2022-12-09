import React from "react";
import type * as G from "types/global";
import { FormControlProps } from "components/FormControl";

type Size = G.Responsive<"medium" | "large" | "xlarge">;

type BaseProps = {
	id?: string;
	name: string;
	size?: Size;
	disabled?: boolean;
	placeholder?: string;
	onChange?: G.ChangeHandler<string, React.ChangeEvent<HTMLTextAreaElement>>;
	className?: G.ClassName;
	attributes?: G.Attributes<"div", Props>;
	inputAttributes?: G.Attributes<"textarea", Omit<Props, "id">>;
} & Pick<FormControlProps, "hasError">;

export type ControlledProps = BaseProps & { value: string; defaultValue?: never };
export type UncontrolledProps = BaseProps & { value?: never; defaultValue?: string };
export type Props = ControlledProps | UncontrolledProps;
