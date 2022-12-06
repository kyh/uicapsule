import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Overlay",
	description: "Dark semi-transparent layer to direct user attention to its content.",
	componentImport: 'import { Overlay } from "reshaped";',
	typeImport: 'import type { OverlayProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-overlay",
	relatedComponents: [{ name: "Image", url: "/content/docs/utilities/image" }],
	properties: {
		base: {
			children: {
				type: ControlType.slot,
				control: { defaultValue: true },
				description: "Overlay content",
			},
			backgroundSlot: {
				type: ControlType.slot,
				control: { ignore: true },
				description: "Content behind the overlay",
			},
			position: {
				type: ControlType.enum,
				options: ["top", "bottom", "start", "end", "cover"],
				defaultValue: "cover",
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
