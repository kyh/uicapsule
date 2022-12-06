import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "View",
	description: "Low-level utility for working with flexbox API and applying design tokens.",
	componentImport: 'import { View } from "reshaped";',
	typeImport: 'import type { ViewProps, ViewItemProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-view",
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				control: { ignore: true },
			},
			direction: {
				type: ControlType.enum,
				options: ["row", "column", "row-reverse", "column-reverse"],
				defaultValue: "column",
				responsive: true,
				control: { defaultValue: "row" },
			},
			gap: {
				type: ControlType.number,
				responsive: true,
				description: "Supports any number value",
				control: { defaultValue: 3 },
			},
			align: {
				type: ControlType.enum,
				options: ["start", "center", "end", "stretch", "baseline"],
				description: "Flexbox align-items value",
				responsive: true,
				control: { defaultValue: "center" },
			},
			justify: {
				type: ControlType.enum,
				options: ["start", "center", "end"],
				responsive: true,
			},
			textAlign: {
				type: ControlType.enum,
				options: ["start", "center", "end"],
			},
			divided: {
				type: ControlType.boolean,
				description: "Separate items with dividers",
			},
			wrap: {
				type: ControlType.boolean,
				responsive: true,
				description: "Flexbox wrap value",
			},
			width: {
				type: ControlType.string,
				responsive: true,
				control: { defaultValue: "300px" },
			},
			height: {
				type: ControlType.string,
				responsive: true,
			},
			maxWidth: {
				type: ControlType.string,
				responsive: true,
			},
			maxWeight: {
				type: ControlType.string,
				responsive: true,
			},
			padding: {
				type: ControlType.number,
				responsive: true,
				docs: { type: "number | [number, number]" },
				control: { defaultValue: 4 },
			},
			paddingTop: {
				type: ControlType.number,
				responsive: true,
			},
			paddingBottom: {
				type: ControlType.number,
				responsive: true,
			},
			paddingStart: {
				type: ControlType.number,
				responsive: true,
			},
			paddingEnd: {
				type: ControlType.number,
				responsive: true,
			},
			bleed: {
				type: ControlType.number,
				responsive: true,
				description: "Horizontal negative margin value, base unit token multiplier",
			},
			backgroundColor: {
				type: ControlType.enum,
				options: [
					"neutral",
					"neutral-faded",
					"critical",
					"critical-faded",
					"positive",
					"positive-faded",
					"primary",
					"primary-faded",
					"page",
					"page-faded",
					"base",
					"elevated",
					"white",
				],
				control: {
					defaultValue: "base",
				},
			},
			borderColor: {
				type: ControlType.enum,
				options: [
					"neutral",
					"neutral-faded",
					"critical",
					"critical-faded",
					"positive",
					"positive-faded",
					"primary",
					"primary-faded",
				],
				control: {
					defaultValue: "neutral-faded",
				},
			},
			borderRadius: {
				type: ControlType.enum,
				options: ["small", "medium", "large"],
				control: { defaultValue: "medium" },
			},
			overflow: {
				type: ControlType.enum,
				options: ["hidden"],
			},
			animated: {
				type: ControlType.boolean,
				description: "Enable color style transitions",
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
		item: {
			children: {
				type: ControlType.slot,
				control: { defaultValue: true, height: 32 },
			},
			grow: {
				type: ControlType.boolean,
				responsive: true,
				description: "Applies nowrap to view",
				control: { defaultValue: true },
			},
			gapBefore: {
				type: ControlType.number,
				responsive: true,
				description: "Supports any number value",
			},
			columns: {
				type: ControlType.string,
				responsive: true,
				docs: { type: "1-12 | auto" },
				description: "Item column width",
			},
			order: {
				type: ControlType.number,
				responsive: true,
				description: "Item flexbox order in view",
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
