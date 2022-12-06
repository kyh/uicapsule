import type { ButtonProps } from "reshaped";

export type Props = Omit<ButtonProps, "type"> & {
	type: "react" | "figma" | "source";
	version?: string;
};
