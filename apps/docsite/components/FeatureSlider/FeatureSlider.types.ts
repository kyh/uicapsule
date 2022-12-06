import { IconProps } from "reshaped";

export type ItemProps = {
	icon: IconProps["svg"];
	iconColor?: string;
	title: string;
};

export type Props = {
	reversed?: boolean;
	items: ItemProps[];
};
