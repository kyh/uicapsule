import React from "react";
import { View, Select } from "reshaped";
import Example from "./Example";

const ExampleSelect = () => (
	<Example
		title="Select"
		text="Dropdown form field used for selecting one option from a list"
		href="/content/docs/components/select"
	>
		<View width="180px" maxWidth="100%">
			<Select
				name="preview"
				placeholder="Sort by"
				options={[{ label: "Following", value: "following" }]}
			/>
		</View>
	</Example>
);

export default ExampleSelect;
