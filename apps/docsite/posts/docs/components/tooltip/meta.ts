import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Tooltip",
	description: "Contextual text information display on element hover or focus.",
	componentImport: 'import { Tooltip } from "reshaped";',
	typeImport: 'import type { TooltipProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-tooltip",
	relatedComponents: [{ name: "Popover", url: "/content/docs/components/popover" }],
	properties: {
		base: {
			text: {
				type: ControlType.slot,
				control: { mode: "text", defaultValue: "Record a message" },
			},
			children: {
				type: ControlType.slot,
				control: { ignore: true },
			},
			position: {
				type: ControlType.enum,
				options: ["top", "top-start", "top-end", "bottom", "bottom-start", "bottom-end"],
				defaultValue: "bottom",
				control: { defaultValue: "top" },
			},
			active: {
				type: ControlType.boolean,
				control: { ignore: true },
				description: "Enables controlled component behavior",
			},
			id: {
				type: ControlType.string,
				control: { ignore: true },
				description: "Custom tooltip id",
			},
			onOpen: {
				type: ControlType.function,
			},
			onClose: {
				type: ControlType.function,
			},
		},
	},
};

export default meta;
