import React from "react";
import { View, Button } from "reshaped";
import IconHeart from "icons/Heart";
import Example from "./Example";

const ExampleButton = () => (
	<Example
		title="Button"
		text="Interactive element used for single-step actions"
		href="/content/docs/components/button"
	>
		<View direction="row" align="center" gap={2}>
			<Button rounded>Cancel</Button>
			<Button color="primary" rounded startIcon={IconHeart}>
				Save
			</Button>
		</View>
	</Example>
);

export default ExampleButton;
