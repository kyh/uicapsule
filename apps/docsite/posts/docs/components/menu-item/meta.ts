import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Menu item",
	description: "Interactive element to show choices or actions in the menu",
	componentImport: 'import { MenuItem } from "reshaped";',
	typeImport: 'import type { MenuItemProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-menuitem",
	relatedComponents: [
		{ name: "Button", url: "/content/docs/components/button" },
		{ name: "Link", url: "/content/docs/components/link" },
		{ name: "Actionable", url: "/content/docs/utilities/actionable" },
	],
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				control: { mode: "text", defaultValue: "Dutch" },
			},
			endSlot: {
				type: ControlType.slot,
				control: { mode: "text", defaultValue: "NL" },
			},
			startSlot: {
				type: ControlType.slot,
				description: "Ignored when icon property is used",
				control: { mode: "text" },
			},
			startIcon: {
				type: ControlType.icon,
			},
			size: {
				type: ControlType.enum,
				options: ["small", "medium", "large"],
				defaultValue: "medium",
				responsive: true,
			},
			roundedCorners: {
				type: ControlType.boolean,
				control: { defaultValue: true },
			},
			selected: {
				type: ControlType.boolean,
				control: { defaultValue: true },
			},
			disabled: {
				type: ControlType.boolean,
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
			onClick: {
				type: ControlType.function,
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
		aligner: {
			children: {
				type: ControlType.slot,
				control: { ignore: true },
			},
			className: {
				type: ControlType.string,
				docs: { type: "string | string[]" },
				description: "Custom classNames for the root element",
				control: { ignore: true },
			},
			attributes: {
				type: ControlType.object,
				description: "Custom HTML attributes for the root element",
				control: { ignore: true },
			},
		},
	},
};

export default meta;
