import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Accordion",
	description: "Utility to toggle visibily of content regions",
	componentImport: 'import { Accordion } from "reshaped";',
	typeImport: 'import type { AccordionProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-accordion",
	relatedComponents: [{ name: "View", url: "/content/docs/utilities/view" }],
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				control: { ignore: true },
			},
			onToggle: {
				type: ControlType.function,
				args: [{ name: "active", type: "boolean" }],
			},
			active: {
				type: ControlType.boolean,
				description: "Enables controlled component behavior",
				control: { ignore: true },
			},
			defaultActive: {
				type: ControlType.boolean,
				description: "Enables uncontrolled component behavior",
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
		trigger: {
			children: {
				type: ControlType.slot,
				control: { defaultValue: true, ignore: true },
				docs: {
					type: "React.ReactNode | (attributes, props: { active: boolean }): React.ReactNode",
				},
			},
			iconSize: {
				type: ControlType.number,
				responsive: true,
			},
		},
		content: {
			children: {
				type: ControlType.slot,
				control: { defaultValue: true, ignore: true },
			},
		},
	},
};

export default meta;
