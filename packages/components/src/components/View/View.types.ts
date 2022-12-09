import React from "react";
import type * as G from "types/global";

type Columns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto";
export type Direction = "row" | "column" | "row-reverse" | "column-reverse";
export type Padding = number | [number, number];

export type Props<TagName extends keyof JSX.IntrinsicElements = "div"> = {
	children?: React.ReactNode;
	as?: TagName;
	divided?: boolean;
	direction?: G.Responsive<Direction>;
	gap?: G.Responsive<number>;
	wrap?: G.Responsive<boolean>;
	align?: G.Responsive<"center" | "start" | "end" | "stretch" | "baseline">;
	justify?: G.Responsive<"center" | "start" | "end">;
	height?: G.Responsive<string>;
	width?: G.Responsive<string>;
	maxHeight?: G.Responsive<string>;
	maxWidth?: G.Responsive<string>;
	padding?: G.Responsive<Padding>;
	paddingTop?: G.Responsive<number>;
	paddingBottom?: G.Responsive<number>;
	paddingStart?: G.Responsive<number>;
	paddingEnd?: G.Responsive<number>;
	bleed?: G.Responsive<number>;
	textAlign?: "center" | "start" | "end";
	backgroundColor?:
		| "neutral"
		| "neutral-faded"
		| "critical"
		| "critical-faded"
		| "positive"
		| "positive-faded"
		| "primary"
		| "primary-faded"
		| "base"
		| "elevated"
		| "page"
		| "page-faded"
		| "white"
		| "black";
	borderColor?:
		| "neutral"
		| "neutral-faded"
		| "critical"
		| "critical-faded"
		| "positive"
		| "positive-faded"
		| "primary"
		| "primary-faded"
		| "transparent";
	borderRadius?: "small" | "medium" | "large";
	shadow?: "base" | "elevated";
	overflow?: "hidden";
	animated?: boolean;
	className?: G.ClassName;
	attributes?: G.Attributes<TagName>;
};

export type ItemProps<TagName extends keyof JSX.IntrinsicElements = "div"> = {
	order?: G.Responsive<number>;
	columns?: G.Responsive<Columns>;
	grow?: G.Responsive<boolean>;
	gapBefore?: G.Responsive<number> | "auto";
	as?: TagName;
	attributes?: G.Attributes<TagName>;
	className?: G.ClassName;
	children?: React.ReactNode;
};

export type RenderItem = (args: {
	className?: string;
	child: any;
	index: number;
}) => React.ReactNode;

export type RenderDivider = (args: { className?: string; key: string }) => React.ReactNode;
