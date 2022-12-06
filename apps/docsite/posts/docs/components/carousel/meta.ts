import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
	title: "Carousel",
	description: "Horizontal scrollable areas used for displaying grouped content.",
	componentImport: 'import { Carousel } from "reshaped";',
	typeImport: 'import type { CarouselProps, CarouselInstanceRef } from "reshaped";',
	storybookUrl: "https://reshaped.so/storybook/?path=/story/components-carousel",
	properties: {
		base: {
			children: { type: ControlType.slot, control: { ignore: true } },
			visibleItems: {
				type: ControlType.number,
				required: true,
				responsive: true,
				control: { defaultValue: 3 },
				description: "Number of items visible at the same time",
			},
			gap: {
				type: ControlType.number,
				defaultValue: 3,
				responsive: true,
				description: "Gap between the carousel items",
			},
			bleed: {
				type: ControlType.number,
				responsive: true,
				description: "Negative margin unit multiplier",
			},
			navigationDisplay: {
				type: ControlType.enum,
				options: ["hidden"],
			},
			instanceRef: {
				type: ControlType.custom,
				docs: {
					type: "CarouselInstanceRef",
				},
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
