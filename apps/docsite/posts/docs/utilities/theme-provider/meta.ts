import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Theme provider",
	description: "Utility to apply themes and color modes to specific page areas.",
	componentImport: 'import { ThemeProvider } from "reshaped";',
	typeImport: 'import type { ThemeProviderProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/utilities-theme",
	properties: {
		base: {
			children: {
				type: ControlType.slot,
			},
			colorMode: {
				type: ControlType.enum,
				options: ["light", "dark", "inverted"],
			},
			theme: {
				type: ControlType.string,
				description: "Imported theme name",
			},
			className: {
				type: ControlType.string,
				docs: { type: "string | string[]" },
				description: "Custom classNames for the root element",
			},
		},
	},
};

export default meta;
