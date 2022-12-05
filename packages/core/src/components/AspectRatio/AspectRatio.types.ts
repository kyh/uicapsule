import type React from "react";
import type * as G from "types/global";

export type Props = {
	children?: React.ReactNode;
	ratio?: G.Responsive<number>;
	className?: G.ClassName;
	attributes?: G.Attributes<"div", Props>;
};
