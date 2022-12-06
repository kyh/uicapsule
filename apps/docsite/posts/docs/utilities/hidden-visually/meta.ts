import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Hidden visually",
	description:
		"Utility that provides the content to assistive technologies while hiding it from the screen.",
	componentImport: 'import { HiddenVisually } from "reshaped";',
	typeImport: 'import type { HiddenVisuallyProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-hiddenvisually",
	properties: {
		base: {
			children: {
				type: ControlType.slot,
			},
		},
	},
};

export default meta;
