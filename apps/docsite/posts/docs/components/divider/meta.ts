import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Divider",
	description: "Element for visual content separation",
	componentImport: 'import { Divider } from "reshaped";',
	typeImport: 'import type { DividerProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-divider",
	relatedComponents: [{ name: "View", url: "/content/docs/utilities/view" }],
	properties: {
		base: {
			vertical: { type: ControlType.boolean, responsive: true },
			blank: { type: ControlType.boolean, description: "Make divider take no space" },
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
