import React from "react";
import { Example, Placeholder } from "utilities/storybook";
import Overlay from "components/Overlay";
import View from "components/View";

export default { title: "Components/Overlay" };

export const position = () => (
	<Example>
		<Example.Item title="position: center">
			<Overlay backgroundSlot={<Placeholder h={200} />}>Overlay</Overlay>
		</Example.Item>

		<Example.Item title="position: bottom">
			<Overlay position="bottom" backgroundSlot={<Placeholder h={200} />}>
				Overlay
			</Overlay>
		</Example.Item>

		<Example.Item title="position: top">
			<Overlay position="top" backgroundSlot={<Placeholder h={200} />}>
				Overlay
			</Overlay>
		</Example.Item>

		<Example.Item title="position: start">
			<Overlay position="start" backgroundSlot={<Placeholder h={200} />}>
				Overlay
			</Overlay>
		</Example.Item>

		<Example.Item title="position: end">
			<Overlay position="end" backgroundSlot={<Placeholder h={200} />}>
				Overlay
			</Overlay>
		</Example.Item>
	</Example>
);

export const composition = () => (
	<Example>
		<Example.Item title="without backgroundSlot, size is based on the parent component">
			<div style={{ height: 300, position: "relative" }}>
				<Overlay>Text</Overlay>
			</div>
		</Example.Item>
	</Example>
);
