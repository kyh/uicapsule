import React from "react";
import type * as G from "types/global";

export type Props = {
	src?: string;
	alt?: string;
	width?: G.Responsive<string>;
	height?: G.Responsive<string>;
	onLoad?: (e: React.SyntheticEvent) => void;
	onError?: (e: React.SyntheticEvent) => void;
	fallback?: string | React.ReactNode | boolean;
	displayMode?: "cover" | "contain";
	borderRadius?: "small" | "medium" | "large";
	className?: G.ClassName;
	attributes?: G.Attributes<"div", Props & { ref: any }>;
	imageAttributes?: G.Attributes<"img", Props>;
};
