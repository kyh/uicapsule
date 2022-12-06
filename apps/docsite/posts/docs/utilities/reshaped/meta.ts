import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Reshaped provider",
	description:
		"Global context provider that provides all of our and your components with a shared context.",
	componentImport: 'import { Reshaped } from "reshaped";',
	typeImport: 'import type { ReshapedProps } from "reshaped";',
	properties: {
		base: {
			theme: {
				type: ControlType.string,
				defaultValue: "reshaped",
			},
			defaultColorMode: {
				type: ControlType.enum,
				options: ["light", "dark"],
			},
			defaultRTL: {
				type: ControlType.boolean,
			},
			toastOptions: {
				type: ControlType.custom,
				docs: { type: "{ [regionName]: ToastRegionOptions }" },
				description: "Global options for the toast component",
			},
			children: {
				type: ControlType.slot,
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
