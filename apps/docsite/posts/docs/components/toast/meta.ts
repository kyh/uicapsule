import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Toast",
	description: "Notification message or a piece of information displayed above the page content.",
	componentImport: 'import { useToast } from "reshaped";',
	typeImport: 'import type { ToastProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-toast",
	relatedComponents: [
		{ name: "Alert", url: "/content/docs/components/alert" },
		{ name: "Dismissible", url: "/content/docs/utilities/dismissible" },
		{ name: "Card", url: "/content/docs/components/card" },
	],
	properties: {
		base: {
			color: {
				type: ControlType.enum,
				options: ["inverted", "neutral", "primary", "positive", "critical"],
				defaultValue: "inverted",
			},
			title: {
				type: ControlType.string,
			},
			text: {
				type: ControlType.string,
				control: { defaultValue: "Account created" },
			},
			icon: {
				type: ControlType.icon,
				control: { defaultValue: "IconZap" },
			},
			startSlot: {
				type: ControlType.slot,
			},
			children: {
				type: ControlType.slot,
				control: { ignore: true },
			},
			actionsSlot: {
				type: ControlType.slot,
				control: { height: 24 },
			},
			position: {
				type: ControlType.enum,
				options: ["bottom-start", "bottom", "bottom-end", "top-start", "top", "top-end"],
				defaultValue: "bottom-end",
			},
			size: {
				type: ControlType.enum,
				options: ["small", "medium", "large"],
				defaultValue: "small",
			},
			timeout: {
				type: ControlType.enum,
				options: ["short", "long"],
				defaultValue: "short",
			},
			attributes: {
				type: ControlType.object,
				description: "Custom HTML attributes for the root element",
			},
		},
	},
};

export default meta;
