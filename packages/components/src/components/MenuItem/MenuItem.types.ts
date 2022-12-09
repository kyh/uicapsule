import type React from "react";
import type { IconProps } from "components/Icon";
import type { ActionableProps } from "components/Actionable";
import type * as G from "types/global";

export type Size = "small" | "medium" | "large";

type WithItemStartSlot = { icon?: never; startIcon?: never; startSlot?: React.ReactNode };
type WithItemIcon = {
	startIcon?: IconProps["svg"];
	startSlot?: never;
	/** @deprecated Use startIcon property instead */
	icon?: IconProps["svg"];
};
type WithItemStart = WithItemStartSlot | WithItemIcon;

export type Props = Omit<ActionableProps, "type"> &
	WithItemStart & {
		children: React.ReactNode;
		endSlot?: React.ReactNode;
		selected?: boolean;
		size?: G.Responsive<Size>;
		roundedCorners?: G.Responsive<boolean>;
	};

export type AlignerProps = {
	children: React.ReactElement;
	className?: G.ClassName;
	attributes?: G.Attributes<"div", AlignerProps>;
};

export type Export = React.ForwardRefExoticComponent<Props> & {
	Aligner: React.ComponentType<AlignerProps>;
};
