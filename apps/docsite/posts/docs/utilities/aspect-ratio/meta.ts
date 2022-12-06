import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Aspect ratio",
	description: "Low-level utility for creating interactive elements.",
	componentImport: 'import { AspectRatio } from "reshaped";',
	typeImport: 'import type { AspectRatioProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-aspectratio",
	relatedComponents: [{ name: "Image", url: "/content/docs/utilities/image" }],
	properties: {
		base: {
			ratio: {
				type: ControlType.number,
				defaultValue: 1,
				responsive: true,
				control: { defaultValue: +(16 / 9).toFixed(2), step: 0.1 },
				description: "Width to height proportions, you can use {x / y} format",
			},
			children: {
				type: ControlType.slot,
				control: { ignore: true },
			},
			className: {
				type: ControlType.string,
				docs: { type: "string | string[]" },
				description: "Custom classNames for the root element",
			},
			attributes: {
				type: ControlType.object,
				description: "Custom HTML attributes for the root element",
			},
		},
	},
};

export default meta;
