import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Actionable",
	description: "Low-level utility for creating interactive elements",
	componentImport: 'import { Actionable } from "reshaped";',
	typeImport: 'import type { ActionableProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-actionable",
	relatedComponents: [
		{ name: "Button", url: "/content/docs/components/button" },
		{ name: "Link", url: "/content/docs/components/link" },
		{ name: "Menu Item", url: "/content/docs/components/menu-item" },
	],
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				control: { mode: "text", defaultValue: "Action" },
			},
			fullWidth: {
				type: ControlType.boolean,
				description: "Display as a block taking full-width of the parent",
			},
			insetFocus: {
				type: ControlType.boolean,
				description: "Display focus ring inside the component boundaries",
			},
			disabled: {
				type: ControlType.boolean,
			},
			borderRadius: {
				type: ControlType.enum,
				options: ["inherit"],
				description:
					"Inherit radius applies focus ring to the direct children instead of the Actionable",
			},
			onClick: {
				type: ControlType.function,
			},
			href: {
				type: ControlType.string,
			},
			type: {
				type: ControlType.enum,
				options: ["button", "submit", "reset"],
				defaultValue: "button",
				control: { ignore: true },
			},
			as: {
				type: ControlType.string,
				description: "Custom tag name for the root element",
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
