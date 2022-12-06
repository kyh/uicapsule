import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Select",
	description: "Select lets you choose a single value from a list of options.",
	componentImport: 'import { Select } from "reshaped";',
	typeImport: 'import type { SelectProps } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-select",
	relatedComponents: [
		{ name: "Checkbox", url: "/content/docs/components/checkbox" },
		{ name: "Switch", url: "/content/docs/components/switch" },
		{ name: "Radio", url: "/content/docs/components/radio" },
	],
	properties: {
		base: {
			options: {
				type: ControlType.array,
				required: true,
				item: {
					type: ControlType.object,
					properties: {
						label: {
							type: ControlType.string,
							required: true,
						},
						value: { type: ControlType.string, required: true },
					},
				},
				control: {
					defaultValue: [
						{ label: "Following", value: "1" },
						{ label: "Popular", value: "2" },
						{
							label: "New & Noteworthy",
							value: "3",
						},
					],
				},
			},
			name: {
				type: ControlType.string,
				control: { ignore: true, defaultValue: "sort" },
			},
			value: {
				type: ControlType.string,
				control: { ignore: true },
				description: "Enables controlled component behavior",
			},
			defaultValue: {
				type: ControlType.string,
				description: "Enables uncontrolled component behavior",
			},
			placeholder: {
				type: ControlType.string,
				control: { defaultValue: "Sort by" },
			},
			size: {
				type: ControlType.enum,
				options: ["medium", "large", "xlarge"],
				responsive: true,
			},
			icon: {
				type: ControlType.icon,
			},
			startSlot: {
				type: ControlType.slot,
				control: { height: 24 },
			},
			disabled: {
				type: ControlType.boolean,
			},
			hasError: {
				type: ControlType.boolean,
			},
			onChange: {
				type: ControlType.function,
				args: [{ name: "args", type: "{ event, name, value }" }],
			},
			id: {
				type: ControlType.string,
				control: { ignore: true },
				description: "Custom id override",
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
			inputAttributes: {
				type: ControlType.object,
				description: "Custom HTML attributes for the input element",
				control: { ignore: true },
			},
		},
	},
};

export default meta;
