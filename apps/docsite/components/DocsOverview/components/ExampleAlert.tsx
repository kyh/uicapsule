import React from "react";
import { Alert, View } from "reshaped";
import IconCheckmark from "icons/Checkmark";
import Example from "./Example";

const ExampleAlert = () => (
	<Example
		title="Alert"
		text="Prominent message related to the whole page or its specific area"
		href="/content/docs/components/alert"
	>
		<View width="200px" maxWidth="100%">
			<Alert color="positive" icon={IconCheckmark}>
				Confirmation sent
			</Alert>
		</View>
	</Example>
);

export default ExampleAlert;
