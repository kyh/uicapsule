import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Hidden",
	description:
		"Utility that lets you hide content responsively with server-side rendering support.",
	componentImport: 'import { Hidden } from "reshaped";',
	typeImport: 'import type { HiddenProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-hidden",
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				docs: { type: "React.ReactNode | (className: string): React.ReactNode" },
			},
			hide: {
				type: ControlType.boolean,
				responsive: true,
			},
			visibility: {
				type: ControlType.boolean,
				description: "Toggle css visibility instead of display",
			},
			as: {
				type: ControlType.string,
				description: "Custom tag name for the root element",
			},
			inline: {
				type: ControlType.boolean,
				description: "Use display: inline when hide is not active",
			},
		},
	},
};

export default meta;
