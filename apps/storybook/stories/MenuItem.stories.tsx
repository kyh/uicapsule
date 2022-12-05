import React from "react";
import { Example, Placeholder } from "utilities/storybook";
import View from "components/View";
import Text from "components/Text";
import MenuItem from "components/MenuItem";
import IconZap from "icons/Zap";

export default { title: "Components/MenuItem" };

export const size = () => (
	<Example>
		<Example.Item title="size: small">
			<MenuItem size="small" startIcon={IconZap} onClick={() => {}}>
				Menu item
			</MenuItem>
		</Example.Item>
		<Example.Item title="size: medium">
			<MenuItem startIcon={IconZap} onClick={() => {}}>
				Menu item
			</MenuItem>
		</Example.Item>
		<Example.Item title="size: large">
			<MenuItem size="large" startIcon={IconZap} onClick={() => {}}>
				Menu item
			</MenuItem>
		</Example.Item>
		<Example.Item title={["responsive size", "[s] small", "[m] medium", "[l+] large"]}>
			<MenuItem
				size={{ s: "small", m: "medium", l: "large" }}
				startIcon={IconZap}
				onClick={() => {}}
			>
				Menu item
			</MenuItem>
		</Example.Item>
	</Example>
);

export const selected = () => (
	<Example>
		<Example.Item title="selected">
			<MenuItem selected startIcon={IconZap}>
				Menu item
			</MenuItem>
		</Example.Item>
	</Example>
);

export const disabled = () => (
	<Example>
		<Example.Item title="disabled">
			<MenuItem disabled startIcon={IconZap}>
				Menu item
			</MenuItem>
		</Example.Item>
	</Example>
);

export const roundedCorners = () => (
	<Example>
		<Example.Item title="roundedCorners">
			<MenuItem roundedCorners selected startIcon={IconZap}>
				Menu item
			</MenuItem>
		</Example.Item>

		<Example.Item title={["responsive roundedCorners", "[s]: false", "[m+]: true"]}>
			<MenuItem roundedCorners={{ s: false, m: true }} selected startIcon={IconZap}>
				Menu item
			</MenuItem>
		</Example.Item>
	</Example>
);

export const slots = () => (
	<Example>
		<Example.Item title="startSlot, endSlot, selected">
			<MenuItem startSlot={<Placeholder h={20} />} endSlot={<Placeholder h={20} />} selected>
				Menu item
			</MenuItem>
		</Example.Item>
	</Example>
);

export const aligner = () => (
	<Example>
		<Example.Item title="size: small">
			<View gap={2}>
				<Text variant="title-3">Heading</Text>
				<MenuItem.Aligner>
					<MenuItem size="small" selected>
						Menu item
					</MenuItem>
				</MenuItem.Aligner>
			</View>
		</Example.Item>

		<Example.Item title="size: medium">
			<View gap={2}>
				<Text variant="title-3">Heading</Text>
				<MenuItem.Aligner>
					<MenuItem selected>Menu item</MenuItem>
				</MenuItem.Aligner>
			</View>
		</Example.Item>

		<Example.Item title="size: large">
			<View gap={2}>
				<Text variant="title-3">Heading</Text>
				<MenuItem.Aligner>
					<MenuItem size="large" selected>
						Menu item
					</MenuItem>
				</MenuItem.Aligner>
			</View>
		</Example.Item>
	</Example>
);
