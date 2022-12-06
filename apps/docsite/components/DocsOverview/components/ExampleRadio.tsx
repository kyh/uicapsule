import React from "react";
import { RadioGroup, View, Radio } from "reshaped";
import Example from "./Example";

const ExampleRadio = () => (
	<Example
		title="Radio"
		text="Form field used for selecting one option from a list"
		href="/content/docs/components/radio"
	>
		<RadioGroup name="preview" defaultValue="pizza">
			<View gap={3}>
				<Radio value="pizza">Pizza</Radio>
				<Radio value="ice-cream">Ice cream</Radio>
			</View>
		</RadioGroup>
	</Example>
);

export default ExampleRadio;
