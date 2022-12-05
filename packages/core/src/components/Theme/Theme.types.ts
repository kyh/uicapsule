import React from "react";
import * as G from "types/global";

export type ColorMode = "light" | "dark";
// export type Theme = { light: string; dark: string };

export type GlobalColorModeContextData = {
	mode: ColorMode;
	setMode: (mode: ColorMode) => void;
	invertMode: () => void;
};

export type ThemeContextData = { colorMode: ColorMode; theme: string };

export type Props = {
	theme?: string;
	colorMode?: ColorMode | "inverted";
	className?: G.ClassName;
	children?: React.ReactNode;
};

export type GlobalColorModeProps = {
	defaultMode?: ColorMode;
	children?: React.ReactNode;
};
