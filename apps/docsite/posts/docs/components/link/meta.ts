import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Link",
	description: "Interactive text element used for navigation within the text paragraphs.",
	componentImport: 'import { Link } from "reshaped";',
	typeImport: 'import type { LinkProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-link",
	relatedComponents: [
		{ name: "Button", url: "/content/docs/components/button" },
		{ name: "Menu Item", url: "/content/docs/components/menu-item" },
		{ name: "Actionable", url: "/content/docs/utilities/actionable" },
	],
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				control: { mode: "text", defaultValue: "Proceed to checkout" },
			},
			color: {
				type: ControlType.enum,
				options: ["primary", "critical", "inherit"],
				defaultValue: "primary",
			},
			variant: {
				type: ControlType.enum,
				options: ["plain", "underline"],
				defaultValue: "underline",
			},
			icon: {
				type: ControlType.icon,
				control: {
					defaultValue: "IconZap",
				},
			},
			disabled: {
				type: ControlType.boolean,
			},
			type: {
				type: ControlType.enum,
				options: ["button", "submit", "reset"],
				defaultValue: "button",
				description: "HTML type attribute",
			},
			href: {
				type: ControlType.string,
			},
			onClick: {
				type: ControlType.function,
				args: [{ name: "event", type: "React.Event" }],
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
