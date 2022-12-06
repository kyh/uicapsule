import React from "react";
import { View, FormControl, TextField } from "reshaped";
import Example from "./Example";

const ExampleTextField = () => (
	<Example
		title="Text field"
		text="Form field to enter and edit single-line text"
		href="/content/docs/components/text-field"
	>
		<View width="180px" maxWidth="100%">
			<FormControl>
				<FormControl.Label>Your email</FormControl.Label>
				<TextField name="preview" placeholder="hello@reshaped.so" />
			</FormControl>
		</View>
	</Example>
);

export default ExampleTextField;
