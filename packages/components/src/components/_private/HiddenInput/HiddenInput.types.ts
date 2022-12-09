import React from "react";
import type * as G from "types/global";

export type Props = {
	name?: string;
	value?: string;
	checked?: boolean;
	defaultChecked?: boolean;
	disabled?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	type: "checkbox" | "radio";
	className?: G.ClassName;
	attributes?: G.Attributes<"input", Props>;
};
