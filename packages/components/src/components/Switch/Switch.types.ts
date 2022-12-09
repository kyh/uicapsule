import type * as G from "types/global";

type BaseProps = {
	id?: string;
	name: string;
	disabled?: boolean;
	onChange?: G.ChangeHandler<boolean>;
	className?: G.ClassName;
	attributes?: G.Attributes<"label", Props>;
	inputAttributes?: G.Attributes<"input", Omit<Props, "id">>;
};

export type ControlledProps = BaseProps & { defaultChecked?: never; checked: boolean };
export type UncontrolledProps = BaseProps & { defaultChecked?: boolean; checked?: boolean };
export type Props = ControlledProps | UncontrolledProps;
